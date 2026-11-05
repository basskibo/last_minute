import * as cheerio from "cheerio";
import type { Offer, Provider, SearchParams } from "./types";
import { acquireBrowserContext } from "../browser";
import { normalizeDestinationKey, parsePriceEur } from "./scrape-utils";

const BASE_URL = "https://www.filiptravel.rs";
const AGENCY = "Filip Travel";

function isBlocked(title: string, html: string): boolean {
  return /just a moment|sačekajte trenutak|security verification|cloudflare/i.test(title + html.slice(0, 2000));
}

function parseOffers(html: string, country: string): Offer[] {
  const $ = cheerio.load(html);
  const offers: Offer[] = [];

  $("a, article, .card, .offer, .product, li").each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, " ").trim();
    if (text.length < 12 || text.length > 500) return;

    const priceMatch = text.match(/(?:od\s+)?(\d+(?:[.,]\d+)?)\s*€/i);
    if (!priceMatch) return;

    const href = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href");
    const title =
      $el.find("h2, h3, h4, .title, strong").first().text().replace(/\s+/g, " ").trim() ||
      text.replace(/od\s+\d+€.*$/i, "").slice(0, 80).trim();

    if (!title || title.length < 3) return;

    const id = `filip-${(href ?? title).replace(/\W+/g, "-")}`.slice(0, 160);
    if (offers.some((o) => o.id === id)) return;

    offers.push({
      id,
      source: "filiptravel.rs",
      sourceLabel: AGENCY,
      provider: "filiptravel",
      title,
      location: title,
      country,
      agency: AGENCY,
      pricePerPerson: parsePriceEur(priceMatch[1]),
      currency: "EUR",
      transport: ["nepoznato"],
      accommodation: ["nepoznato"],
      sourceUrl: href ? new URL(href, BASE_URL).toString() : BASE_URL,
      tags: [],
    });
  });

  return offers;
}

export async function searchFilipTravel(params: SearchParams): Promise<Offer[]> {
  const destKey = normalizeDestinationKey(params.destination);
  // Deli isti Chromium sa Booking/Airbnb (vidi lib/browser.ts) — tri
  // odvojena browsera bi na serverless funkciji lako potrošila memoriju.
  const { context, release } = await acquireBrowserContext();

  try {
    const page = await context.newPage();

    // Sajt je iza Cloudflare provere — kratko čekanje i manje putanja, da ne
    // drži zajednički browser zauzetim (ranije je redovno isticao posle 45 s).
    const paths = [`/destinacije/${destKey}`, `/last-minute`];
    const offers: Offer[] = [];

    for (const path of paths) {
      try {
        await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 12000 });
        for (let i = 0; i < 4; i++) {
          const title = await page.title();
          const html = await page.content();
          if (!isBlocked(title, html)) break;
          await page.waitForTimeout(2000);
        }

        const title = await page.title();
        const html = await page.content();
        if (isBlocked(title, html)) continue;

        const pageOffers = parseOffers(html, params.destination).filter((o) => {
          const hay = `${o.title} ${o.location} ${o.sourceUrl}`.toLowerCase();
          return hay.includes(destKey) || path === "/last-minute" || path === "/ponude";
        });
        offers.push(...pageOffers);
        if (offers.length > 0) break;
      } catch {
        // probaj sledeću putanju
      }
    }

    return offers;
  } finally {
    await release();
  }
}

export const filipTravelProvider: Provider = {
  id: "filiptravel",
  label: "Filip Travel",
  note: "Sajt često blokira automatske zahteve (Cloudflare) — rezultati mogu biti prazni.",
  timeoutMs: 30000,
  search: searchFilipTravel,
};
