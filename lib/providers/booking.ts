import type { Page } from "playwright-core";
import type { Offer, Provider, SearchParams } from "./types";
import { acquireBrowserContext, describeEmptyPage } from "../browser";
import { pickStayDates, formatDateRange } from "../dates";

/**
 * Booking.com blokira obične (ne-browser) HTTP zahteve na nivou AWS WAF-a —
 * potreban je pravi (headless) browser koji izvrši JS izazov.
 *
 * Zašto je ranije vraćao malo rezultata:
 * - destinacija je slata na srpskom ("Grčka", "Španija"), što Booking često
 *   ne prepozna kao regiju → sada šaljemo engleski naziv ("Spain",
 *   "Barcelona, Spain"), vidi lib/destinations.ts;
 * - čitala se samo prva strana i to čim se pojavi prva kartica → sada se
 *   paralelno učitavaju 2 strane (offset 0 i 25) i čeka se da se kartice
 *   izrenderuju.
 *
 * Cena po osobi je aproksimacija (ukupna cena / broj osoba) jer Booking
 * cenuje po smeštajnoj jedinici, ne po osobi.
 */

const PAGES = [0, 25];
/** Ukupno vreme za Booking unutar timeoutMs provajdera (ostaje rezerva za zatvaranje). */
const BOOKING_BUDGET_MS = 44000;

/** Kartica hotela; drugi selektor je rezerva ako Booking preimenuje omotač. */
const CARD_SELECTOR = '[data-testid="property-card"], [data-testid="property-card-container"]';

function parseMoney(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/\s/g, "").match(/(\d[\d.,]*)/);
  if (!match) return null;
  const raw = match[1];
  // "1,234" / "1.234" (hiljade) vs "12.50" (decimale)
  const normalized = /[.,]\d{3}(?!\d)/.test(raw)
    ? raw.replace(/[.,](?=\d{3}(?!\d))/g, "").replace(",", ".")
    : raw.replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

interface RawCard {
  title: string;
  address: string;
  priceText: string;
  allText: string;
  link: string;
  image: string;
  reviewText: string;
}

/**
 * Čeka kartice hotela ILI Booking-ovu poruku "0 properties …" (tada nema
 * svrhe čekati do isteka — odmah prelazimo na pretragu sa dest_id).
 */
async function waitForCards(page: Page, timeout: number): Promise<boolean> {
  const outcome = await page
    .waitForFunction(
      (selector) => {
        if (document.querySelector(selector)) return "cards";
        const h1 = document.querySelector("h1")?.textContent ?? "";
        return /^\s*0 propert/i.test(h1) ? "empty" : null;
      },
      CARD_SELECTOR,
      { timeout }
    )
    .then((handle) => handle.jsonValue())
    .catch(() => "timeout");
  return outcome === "cards";
}

async function scrapePage(
  page: Page,
  url: string,
  deadline: number,
  allowReload = true
): Promise<RawCard[]> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  let found = await waitForCards(page, Math.min(12000, Math.max(3000, deadline - Date.now() - 2000)));

  // Booking ponekad prvo vrati "ljušturu" strane, a hotele učita tek kad
  // AWS WAF JavaScript postavi token — ponovno učitavanje ih tada vrati.
  if (!found && allowReload && deadline - Date.now() > 9000) {
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => null);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
    found = await waitForCards(page, Math.max(3000, Math.min(12000, deadline - Date.now() - 2000)));
  }
  if (!found) return [];

  // Kartice se dorenderuju posle prve — kratko sačekaj i skroluj do dna.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => null);
  await page.waitForTimeout(1000);

  return page.$$eval(CARD_SELECTOR, (nodes) =>
    nodes.map((card) => {
      const q = (sel: string) => card.querySelector(sel);
      return {
        title: q('[data-testid="title"]')?.textContent?.trim() ?? "",
        address: q('[data-testid="address"], [data-testid="address-link"]')?.textContent?.trim() ?? "",
        priceText: q('[data-testid="price-and-discounted-price"]')?.textContent?.trim() ?? "",
        allText: (card as HTMLElement).innerText ?? card.textContent ?? "",
        link: q('[data-testid="title-link"]')?.getAttribute("href") ?? "",
        image: q("img")?.getAttribute("src") ?? "",
        reviewText: q('[data-testid="review-score"]')?.textContent?.trim() ?? "",
      };
    })
  );
}

interface BookingDest {
  dest_id: string;
  dest_type: string;
  label?: string;
}

/** dest_id po upitu — Booking ID-jevi se ne menjaju, čuvamo ih dok instanca živi. */
const destCache = new Map<string, BookingDest>();

/**
 * Booking-ova pretraga traži interni ID destinacije (dest_id + dest_type),
 * koji njihov sajt dobija iz servisa za predloge dok korisnik kuca. Sam
 * tekst `ss=Paris` sa servera daje "0 properties are available in and
 * around this destination". Zovemo isti servis IZ već otvorene Booking
 * strane (isti kolačići i WAF token kao pravi posetilac).
 */
async function resolveBookingDest(
  page: Page,
  query: string
): Promise<{ dest?: BookingDest; error?: string }> {
  const key = query.toLowerCase();
  const cached = destCache.get(key);
  if (cached) return { dest: cached };

  const result = await page
    .evaluate(async (q) => {
      try {
        const res = await fetch("https://accommodations.booking.com/autocomplete.json", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ query: q, language: "en-us", size: 5 }),
        });
        if (!res.ok) return { error: `autocomplete HTTP ${res.status}` };
        const data = (await res.json()) as {
          results?: { dest_id?: string | number; dest_type?: string; label?: string; value?: string }[];
        };
        const hit = (data.results ?? []).find((r) => r.dest_id != null && r.dest_type);
        return hit
          ? { dest: { dest_id: String(hit.dest_id), dest_type: String(hit.dest_type), label: hit.label ?? hit.value } }
          : { error: `autocomplete bez rezultata (${(data.results ?? []).length})` };
      } catch (err) {
        return { error: `autocomplete: ${String(err).slice(0, 80)}` };
      }
    }, query)
    .catch((err: unknown) => ({ error: `autocomplete: ${String(err).slice(0, 80)}` }) as { dest?: BookingDest; error?: string });

  if (result.dest) destCache.set(key, result.dest);
  return result;
}

export async function searchBooking(params: SearchParams): Promise<Offer[]> {
  const { checkin, checkout, nights } = pickStayDates(params.month, params);
  const { context, release } = await acquireBrowserContext();

  try {
    // Samo naziv mesta ("Paris", "Spain"), bez ", Država": Booking je
    // "Paris%2C+France" čitao bukvalno (naslov strane: "Search results:
    // Paris%2C+France") i vraćao praznu stranu bez hotela. Razmaci kao %20.
    const ss = (params.bookingQuery || params.destination).split(",")[0].trim();
    const q = (k: string, v: string | number) => `${k}=${encodeURIComponent(String(v))}`;
    const buildUrl = (offset: number, dest?: BookingDest) =>
      "https://www.booking.com/searchresults.html?" +
      [
        q("ss", ss),
        q("ssne", ss),
        q("ssne_untouched", ss),
        ...(dest ? [q("dest_id", dest.dest_id), q("dest_type", dest.dest_type)] : []),
        q("checkin", checkin),
        q("checkout", checkout),
        q("group_adults", params.adults),
        q("group_children", params.children),
        ...Array.from({ length: params.children }, () => q("age", 8)),
        q("no_rooms", 1),
        q("selected_currency", "EUR"),
        q("lang", "en-us"),
        ...(offset ? [q("offset", offset)] : []),
      ].join("&");

    const deadline = Date.now() + BOOKING_BUDGET_MS;
    const page = await context.newPage();

    // 1) Poznat dest_id (keš) → direktno. Inače prvo tekstualna pretraga,
    //    koja ujedno otvori Booking i postavi WAF token.
    let dest = destCache.get(ss.toLowerCase());
    let raw: RawCard[] = await scrapePage(page, buildUrl(0, dest), deadline, false);
    let destError: string | undefined;

    // 2) Nema hotela → uzmi dest_id iz Booking-ovog servisa za predloge.
    if (raw.length === 0 && !dest && deadline - Date.now() > 8000) {
      const resolved = await resolveBookingDest(page, ss);
      dest = resolved.dest;
      destError = resolved.error;
      if (dest) raw = await scrapePage(page, buildUrl(0, dest), deadline, true);
    }

    // 3) I dalje ništa, a dest_id nemamo → ponovo tekstualna pretraga sada
    //    kad je WAF token postavljen (hoteli ponekad stižu tek tada).
    if (raw.length === 0 && !dest && deadline - Date.now() > 8000) {
      raw = await scrapePage(page, buildUrl(0), deadline, true);
    }

    if (raw.length === 0) {
      const destInfo = dest
        ? `dest_id ${dest.dest_id} (${dest.dest_type}${dest.label ? `, ${dest.label}` : ""})`
        : `dest_id nije pronađen — ${destError ?? "nije pokušano"}`;
      throw new Error(`Booking: ${destInfo}; ${await describeEmptyPage(page)}`);
    }

    // Druga strana rezultata samo ako je ostalo vremena.
    for (const offset of PAGES.slice(1)) {
      if (deadline - Date.now() < 10000) break;
      raw.push(...(await scrapePage(page, buildUrl(offset, dest), deadline, false).catch(() => [])));
    }

    const people = params.adults + params.children;
    const dateRange = formatDateRange(checkin, checkout);
    const seen = new Set<string>();

    return raw
      .filter((r) => r.title && r.link)
      .map((r): Offer | null => {
        const path = r.link.split("?")[0];
        if (seen.has(path)) return null;
        seen.add(path);

        // Booking u kartici ima i tekst za čitače ekrana:
        // "Original price € 1,234. Current price € 999."
        // Bilo koja oznaka valute (€, EUR…) između teksta i iznosa.
        const original = r.allText.match(/Original price\D{0,8}?([\d.,]+)/i);
        const current = r.allText.match(/Current price\D{0,8}?([\d.,]+)/i);
        const total = parseMoney(current?.[1]) ?? parseMoney(r.priceText);
        const oldTotal = parseMoney(original?.[1]);

        const scoreMatch = r.reviewText.match(/(\d{1,2}[.,]\d)/);
        const rating = scoreMatch ? parseFloat(scoreMatch[1].replace(",", ".")) : undefined;
        const countMatch = r.reviewText.match(/([\d.,]+)\s+reviews?/i);
        const reviewCount = countMatch ? parseInt(countMatch[1].replace(/[.,]/g, ""), 10) : undefined;

        return {
          id: `booking-${path}`.slice(0, 160),
          source: "booking.com",
          sourceLabel: "Booking.com",
          provider: "booking",
          title: r.title,
          location: r.address || params.destination,
          country: params.destination,
          pricePerPerson: total != null ? Math.round(total / people) : null,
          oldPricePerPerson:
            oldTotal != null && total != null && oldTotal > total ? Math.round(oldTotal / people) : null,
          currency: "EUR",
          nights: `${nights} noćenja`,
          dateRange,
          transport: ["sopstveni"],
          accommodation: ["hotel"],
          image: r.image || undefined,
          sourceUrl: r.link.startsWith("http") ? r.link : `https://www.booking.com${r.link}`,
          tags: rating != null ? [`Ocena ${rating.toFixed(1)}`] : [],
          rating: rating != null && rating <= 10 ? rating : undefined,
          reviewCount,
        };
      })
      .filter((o): o is Offer => o !== null);
  } finally {
    await release();
  }
}

export const bookingProvider: Provider = {
  id: "booking",
  label: "Booking.com",
  scope: "place",
  timeoutMs: 50000,
  search: searchBooking,
};
