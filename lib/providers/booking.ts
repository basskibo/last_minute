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

/** Samo prva strana (25 hotela): druga strana je na serverless funkciji
 * udvostručavala vreme i memoriju, a retko donosi bolje ponude. */
const PAGES = [0];
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

/** Rekurzivno nađe prvi objekat sa dest_id/dest_type (JSON) ili destId/destType (GraphQL). */
function findDest(node: unknown, depth = 0): BookingDest | undefined {
  if (!node || typeof node !== "object" || depth > 12) return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findDest(item, depth + 1);
      if (hit) return hit;
    }
    return undefined;
  }
  const o = node as Record<string, unknown>;
  const id = o.dest_id ?? o.destId;
  const type = o.dest_type ?? o.destType;
  if ((typeof id === "string" || typeof id === "number") && typeof type === "string" && String(id)) {
    const label = o.label ?? o.value ?? o.title;
    return { dest_id: String(id), dest_type: type.toLowerCase(), label: typeof label === "string" ? label : undefined };
  }
  for (const value of Object.values(o)) {
    const hit = findDest(value, depth + 1);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * dest_id za mesto, onako kako ga dobija pravi posetilac: otvori Booking
 * početnu, ukuca mesto u njihovo polje i PRESRETNE odgovor koji dobije
 * Booking-ov sopstveni JavaScript. (Naš direktan poziv servisa za predloge
 * je sa Vercela dobijao 403 — njihov zahtev nosi zaglavlja/tokene sajta.)
 */
async function resolveViaSite(
  page: Page,
  query: string,
  deadline: number
): Promise<{ dest?: BookingDest; error?: string }> {
  const cached = destCache.get(query.toLowerCase());
  if (cached) return { dest: cached };

  let found: BookingDest | undefined;
  const statuses: string[] = [];
  const onResponse = async (res: import("playwright-core").Response) => {
    if (found || !/autocomplete|graphql/i.test(res.url())) return;
    if (res.request().method() === "OPTIONS") return;
    statuses.push(String(res.status()));
    if (!res.ok()) return;
    try {
      found ??= findDest(await res.json());
    } catch {
      /* nije JSON */
    }
  };
  page.on("response", onResponse);

  try {
    await page.goto("https://www.booking.com/index.html?lang=en-us&selected_currency=EUR", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.locator("#onetrust-accept-btn-handler").click({ timeout: 1500 }).catch(() => null);
    const input = page.locator('input[name="ss"]').first();
    await input.click({ timeout: 5000 });
    await input.fill("");
    await input.pressSequentially(query, { delay: 70 });

    const until = Math.min(deadline - 12000, Date.now() + 8000);
    while (!found && Date.now() < until) await page.waitForTimeout(250);
  } catch (err) {
    return { error: `polje za pretragu: ${String((err as Error)?.message ?? err).split("\n")[0].slice(0, 100)}` };
  } finally {
    page.off("response", onResponse);
  }

  if (found) {
    destCache.set(query.toLowerCase(), found);
    return { dest: found };
  }
  return {
    error: statuses.length
      ? `predlozi sa sajta bez dest_id (HTTP ${[...new Set(statuses)].join("/")})`
      : "sajt nije pozvao servis za predloge",
  };
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

    // 1) Cela država → dest_id je ISO kod (bez ikakvog poziva).
    // 2) Mesto → dest_id iz predloga koje Booking-ov sajt sam dobije.
    // 3) Mesto bez dest_id → pretraga cele države (ponude za mesto idu na
    //    vrh u lib/search.ts), pa tek onda tekstualna pretraga.
    let dest: BookingDest | undefined = destCache.get(ss.toLowerCase());
    let destNote = dest ? "keš" : "";
    if (!dest && !params.isPlace && params.countryCode) {
      dest = { dest_id: params.countryCode, dest_type: "country" };
      destNote = "kod države";
    }
    if (!dest && deadline - Date.now() > 15000) {
      const viaSite = await resolveViaSite(page, ss, deadline);
      dest = viaSite.dest;
      destNote = viaSite.dest ? "predlozi sa sajta" : `predlozi: ${viaSite.error}`;
    }
    if (!dest && params.countryCode) {
      dest = { dest_id: params.countryCode, dest_type: "country" };
      destNote += "; rezerva: cela država";
    }

    let raw: RawCard[] = await scrapePage(page, buildUrl(0, dest), deadline, true);
    if (raw.length === 0 && dest && deadline - Date.now() > 8000) {
      raw = await scrapePage(page, buildUrl(0), deadline, false);
    }

    if (raw.length === 0) {
      const destInfo = dest
        ? `dest_id ${dest.dest_id} (${dest.dest_type}${dest.label ? `, ${dest.label}` : ""}; ${destNote})`
        : `dest_id nije pronađen (${destNote || "nije pokušano"})`;
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
  usesBrowser: true,
  label: "Booking.com",
  scope: "place",
  timeoutMs: 50000,
  search: searchBooking,
};
