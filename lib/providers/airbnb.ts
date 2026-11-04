import type { Offer, Provider, SearchParams } from "./types";
import { acquireBrowserContext } from "../browser";
import { pickStayDates, formatDateRange } from "../dates";

/**
 * Airbnb renderuje rezultate klijentski (teški JS) i nema javni HTML/JSON
 * endpoint bez browsera — isto rešenje kao Booking (vidi booking.ts):
 * Playwright headless browser, potvrđeno probom protiv /s/{destinacija}/homes.
 *
 * Cena je ukupna cena smeštaja za ceo boravak (Airbnb ne cenuje po osobi za
 * ceo objekat), pa se pricePerPerson računa kao aproksimacija (ukupno / broj
 * osoba), isto kao kod Booking provajdera.
 */

function parsePriceRow(text: string): { oldTotal: number | null; newTotal: number | null } {
  const headline = text.split("Show price breakdown")[0] ?? text;
  const matches = headline.match(/€[\d.,]+/g) ?? [];
  const nums = matches.map((m) => parseFloat(m.replace(/[€,]/g, "")));
  if (nums.length >= 2) return { oldTotal: nums[0], newTotal: nums[1] };
  if (nums.length === 1) return { oldTotal: null, newTotal: nums[0] };
  return { oldTotal: null, newTotal: null };
}

export async function searchAirbnb(params: SearchParams): Promise<Offer[]> {
  const { checkin, checkout, nights } = pickStayDates(params.month, params);
  const { context, release } = await acquireBrowserContext();

  try {
    const page = await context.newPage();
    const place = params.bookingQuery || params.destination;

    const url = new URL(
      `https://www.airbnb.com/s/${encodeURIComponent(place.replace(/,\s*/g, "--").replace(/\s+/g, "-"))}/homes`
    );
    url.searchParams.set("query", place);
    url.searchParams.set("checkin", checkin);
    url.searchParams.set("checkout", checkout);
    url.searchParams.set("adults", String(params.adults));
    if (params.children > 0) url.searchParams.set("children", String(params.children));
    url.searchParams.set("currency", "EUR");

    await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 25000 });
    await page
      .waitForSelector('[itemprop="itemListElement"]', { timeout: 15000 })
      .catch(() => null);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => null);
    await page.waitForTimeout(1000);

    const raw = await page.$$eval('[itemprop="itemListElement"]', (nodes) =>
      nodes.map((card) => {
        const q = (sel: string) => card.querySelector(sel);
        return {
          name:
            q('[itemprop="name"]')?.getAttribute("content") ??
            q('[data-testid="listing-card-name"]')?.textContent?.trim() ??
            "",
          subtitle: q('[data-testid="listing-card-title"]')?.textContent?.trim() ?? "",
          priceRow: q('[data-testid="price-availability-row"]')?.textContent?.trim() ?? "",
          url: q('meta[itemprop="url"]')?.getAttribute("content") ?? "",
          image: q("img")?.getAttribute("src") ?? "",
          allText: (card as HTMLElement).innerText ?? card.textContent ?? "",
        };
      })
    );

    const people = params.adults + params.children;
    const dateRange = formatDateRange(checkin, checkout);

    return raw
      .filter((r) => r.name && r.url)
      .map((r): Offer => {
        const { oldTotal, newTotal } = parsePriceRow(r.priceRow);
        const total = newTotal ?? oldTotal;
        // Ocena u kartici: "4.92 (128)" — Airbnb skala 1–5, mi čuvamo 0–10.
        const ratingMatch = r.allText.match(/(\d\.\d{1,2})\s*\((\d[\d,]*)\)/);
        const rating5 = ratingMatch ? parseFloat(ratingMatch[1]) : null;
        return {
          id: `airbnb-${r.url.split("?")[0]}`.slice(0, 160),
          source: "airbnb.com",
          sourceLabel: "Airbnb",
          provider: "airbnb",
          title: r.name,
          location: r.subtitle || params.destination,
          country: params.destination,
          pricePerPerson: total != null ? Math.round(total / people) : null,
          oldPricePerPerson:
            oldTotal != null && newTotal != null ? Math.round(oldTotal / people) : null,
          currency: "EUR",
          nights: `${nights} noćenja`,
          dateRange,
          transport: ["sopstveni"],
          accommodation: ["apartman"],
          image: r.image || undefined,
          sourceUrl: r.url.startsWith("http") ? r.url : `https://www.airbnb.com${r.url}`,
          tags: rating5 != null ? [`Ocena ${rating5.toFixed(2)} / 5`] : [],
          rating: rating5 != null && rating5 <= 5 ? Math.round(rating5 * 20) / 10 : undefined,
          reviewCount: ratingMatch ? parseInt(ratingMatch[2].replace(/,/g, ""), 10) : undefined,
        };
      });
  } finally {
    await release();
  }
}

export const airbnbProvider: Provider = {
  id: "airbnb",
  label: "Airbnb",
  scope: "place",
  timeoutMs: 40000,
  search: searchAirbnb,
};
