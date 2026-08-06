import type { Offer, Provider, SearchParams } from "./types";
import { launchBrowser } from "../browser";
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
  const { checkin, checkout, nights } = pickStayDates(params.month);
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      viewport: { width: 1366, height: 900 },
      locale: "en-US",
    });

    const url = new URL(`https://www.airbnb.com/s/${encodeURIComponent(params.destination)}/homes`);
    url.searchParams.set("checkin", checkin);
    url.searchParams.set("checkout", checkout);
    url.searchParams.set("adults", String(params.adults));
    if (params.children > 0) url.searchParams.set("children", String(params.children));
    url.searchParams.set("currency", "EUR");

    await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 25000 });
    await page
      .waitForSelector('[itemprop="itemListElement"]', { timeout: 15000 })
      .catch(() => null);

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
          transport: ["nepoznato"],
          accommodation: ["apartman"],
          image: r.image || undefined,
          sourceUrl: r.url.startsWith("http") ? r.url : `https://www.airbnb.com${r.url}`,
          tags: [],
        };
      });
  } finally {
    await browser.close();
  }
}

export const airbnbProvider: Provider = {
  id: "airbnb",
  label: "Airbnb",
  timeoutMs: 30000,
  search: searchAirbnb,
};
