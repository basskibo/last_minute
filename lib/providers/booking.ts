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

async function scrapePage(page: Page, url: string): Promise<RawCard[]> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 }).catch(() => null);
  // Kartice se dorenderuju posle prve — kratko sačekaj i skroluj do dna.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => null);
  await page.waitForTimeout(1200);

  return page.$$eval('[data-testid="property-card"]', (nodes) =>
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

export async function searchBooking(params: SearchParams): Promise<Offer[]> {
  const { checkin, checkout, nights } = pickStayDates(params.month, params);
  const { context, release } = await acquireBrowserContext();

  try {
    const urls = PAGES.map((offset) => {
      const url = new URL("https://www.booking.com/searchresults.html");
      url.searchParams.set("ss", params.bookingQuery || params.destination);
      url.searchParams.set("checkin", checkin);
      url.searchParams.set("checkout", checkout);
      url.searchParams.set("group_adults", String(params.adults));
      url.searchParams.set("group_children", String(params.children));
      for (let i = 0; i < params.children; i++) url.searchParams.append("age", "8");
      url.searchParams.set("no_rooms", "1");
      url.searchParams.set("selected_currency", "EUR");
      url.searchParams.set("lang", "en-us");
      if (offset) url.searchParams.set("offset", String(offset));
      return url.toString();
    });

    const pages = await Promise.all(urls.map(() => context.newPage()));
    const settled = await Promise.allSettled(urls.map((u, i) => scrapePage(pages[i], u)));
    const raw = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    if (raw.length === 0) {
      if (settled.every((r) => r.status === "rejected")) {
        throw (settled[0] as PromiseRejectedResult).reason;
      }
      throw new Error(`Booking: ${await describeEmptyPage(pages[0])}`);
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
        const original = r.allText.match(/Original price\s*€?\s*([\d.,]+)/i);
        const current = r.allText.match(/Current price\s*€?\s*([\d.,]+)/i);
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
  timeoutMs: 40000,
  search: searchBooking,
};
