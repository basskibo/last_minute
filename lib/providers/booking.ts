import type { Offer, Provider, SearchParams } from "./types";
import { launchBrowser } from "../browser";
import { pickStayDates, formatDateRange } from "../dates";

/**
 * Booking.com blokira obične (ne-browser) HTTP zahteve na nivou AWS WAF-a —
 * potreban je pravi (headless) browser koji izvrši JS izazov. Playwright to
 * uspešno prolazi (potvrđeno probom protiv /searchresults.html), ali je
 * sporije od običnog fetch-a (par sekundi po pretrazi) i teže za Vercel
 * serverless (veći cold start) — vidi lib/browser.ts.
 *
 * Nemamo tačan datum od korisnika (samo fleksibilan mesec), pa se koristi
 * razuman 3-noćni prozor iz lib/dates.ts. Cena po osobi je aproksimacija
 * (ukupna cena smeštaja / broj osoba) jer Booking ne cenuje po osobi kao
 * paket aranžmani, već po smeštajnoj jedinici.
 */

function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3})/g, "").replace(/,(?=\d{3})/g, "");
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

function cleanReviewScore(text: string): string | null {
  const match = text.match(/(\d\.\d)/);
  return match ? `Ocena ${match[1]}` : null;
}

export async function searchBooking(params: SearchParams): Promise<Offer[]> {
  const { checkin, checkout, nights } = pickStayDates(params.month);
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      viewport: { width: 1366, height: 900 },
      locale: "en-US",
    });

    const url = new URL("https://www.booking.com/searchresults.html");
    url.searchParams.set("ss", params.destination);
    url.searchParams.set("checkin", checkin);
    url.searchParams.set("checkout", checkout);
    url.searchParams.set("group_adults", String(params.adults));
    url.searchParams.set("group_children", String(params.children));
    url.searchParams.set("no_rooms", "1");
    url.searchParams.set("selected_currency", "EUR");

    await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 25000 });
    await page
      .waitForSelector('[data-testid="property-card"]', { timeout: 15000 })
      .catch(() => null);

    const raw = await page.$$eval('[data-testid="property-card"]', (nodes) =>
      nodes.map((card) => {
        const q = (sel: string) => card.querySelector(sel);
        return {
          title: q('[data-testid="title"]')?.textContent?.trim() ?? "",
          address: q('[data-testid="address-link"]')?.textContent?.trim() ?? "",
          priceText: q('[data-testid="price-and-discounted-price"]')?.textContent?.trim() ?? "",
          link: q('[data-testid="title-link"]')?.getAttribute("href") ?? "",
          image: q("img")?.getAttribute("src") ?? "",
          reviewScore: q('[data-testid="review-score"]')?.textContent?.trim() ?? "",
        };
      })
    );

    const people = params.adults + params.children;
    const dateRange = formatDateRange(checkin, checkout);

    return raw
      .filter((r) => r.title && r.link)
      .map((r): Offer => {
        const total = parsePrice(r.priceText);
        const score = cleanReviewScore(r.reviewScore);
        return {
          id: `booking-${r.link.split("?")[0]}`.slice(0, 160),
          source: "booking.com",
          sourceLabel: "Booking.com",
          provider: "booking",
          title: r.title,
          location: r.address || params.destination,
          country: params.destination,
          pricePerPerson: total != null ? Math.round(total / people) : null,
          oldPricePerPerson: null,
          currency: "EUR",
          nights: `${nights} noćenja`,
          dateRange,
          transport: ["nepoznato"],
          accommodation: ["hotel"],
          image: r.image || undefined,
          sourceUrl: r.link.startsWith("http") ? r.link : `https://www.booking.com${r.link}`,
          tags: score ? [score] : [],
        };
      });
  } finally {
    await browser.close();
  }
}

export const bookingProvider: Provider = {
  id: "booking",
  label: "Booking.com",
  timeoutMs: 30000,
  search: searchBooking,
};
