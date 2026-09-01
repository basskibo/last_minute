import * as cheerio from "cheerio";
import type { AccommodationType, Offer, Provider, SearchParams, TransportType } from "./types";
import { findGrandToursTourTypes, grandToursHitKeyword } from "./agency-destinations";
import { fetchHtml, parsePriceEur } from "./scrape-utils";

const BASE_URL = "https://grandtours.rs";
const AGENCY = "Grand Tours";

interface WpTour {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  class_list: string[];
}

function decodeHtml(text: string): string {
  return cheerio.load(`<div>${text}</div>`)("div").text();
}

function extractTourTypes(classList: string[]): string[] {
  return classList.filter((c) => c.startsWith("tour_type-")).map((c) => c.replace("tour_type-", ""));
}

function matchesDestination(tour: WpTour, destination: string): boolean {
  const types = extractTourTypes(tour.class_list);
  const expected = findGrandToursTourTypes(destination) ?? [];
  if (types.some((t) => expected.includes(t))) return true;
  if (!types.includes("hit-ponude")) return false;
  const hitRe = grandToursHitKeyword(destination);
  if (!hitRe) return false;
  const hay = `${tour.slug} ${decodeHtml(tour.title.rendered)}`.toLowerCase();
  return hitRe.test(hay);
}

function inferTransport(tags: string[]): TransportType[] {
  const t = tags.join(" ").toLowerCase();
  if (t.includes("avion")) return ["avion"];
  if (t.includes("autobus") || t.includes("prevoz-autobusom")) return ["autobus"];
  if (t.includes("sopstveni")) return ["sopstveni"];
  return ["nepoznato"];
}

function inferAccommodation(title: string, tags: string[]): AccommodationType[] {
  const t = `${title} ${tags.join(" ")}`.toLowerCase();
  if (t.includes("hotel")) return ["hotel"];
  if (t.includes("apart") || t.includes("vila")) return ["apartman"];
  return ["nepoznato"];
}

function parsePriceFromDescription(html: string): {
  price: number | null;
  dateRange?: string;
  description?: string;
} {
  const text = cheerio.load(html).text().replace(/\s+/g, " ").trim();
  const priceMatch = text.match(
    /(?:Hit cena|Promo cena|Top cena|Cena)\s*:?\s*([0-9]+(?:[.,][0-9]+)?)\s*€/i
  );
  const dateMatch = text.match(/Termin(?:i)? putovanja\s*:?\s*([^/]+(?:\/[^/]+)?)/i);
  return {
    price: priceMatch ? parsePriceEur(priceMatch[1]) : null,
    dateRange: dateMatch?.[1]?.trim(),
    description: text.slice(0, 240) || undefined,
  };
}

async function fetchAllTours(): Promise<WpTour[]> {
  const tours: WpTour[] = [];
  for (let page = 1; page <= 3; page++) {
    const url = `${BASE_URL}/wp-json/wp/v2/tour?per_page=100&page=${page}&_fields=id,slug,link,title,class_list`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LastMinuteBot/1.0)" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`grandtours.rs HTTP ${res.status}`);
    const batch = (await res.json()) as WpTour[];
    if (batch.length === 0) break;
    tours.push(...batch);
    if (batch.length < 100) break;
  }
  return tours;
}

async function fetchTourSnippet(tour: WpTour): Promise<Offer | null> {
  const html = await fetchHtml(tour.link, 10000);
  const $ = cheerio.load(html);
  const article = $(`article[data-tour-id="${tour.id}"] .post-type.description`).first();
  const { price, dateRange, description } = parsePriceFromDescription(
    article.length ? article.html() ?? "" : ""
  );

  const title = decodeHtml(tour.title.rendered);
  const tags = tour.class_list.filter((c) => c.startsWith("tour_tag-")).map((c) => c.replace("tour_tag-", ""));
  const image = $(`article[data-tour-id="${tour.id}"] img`).first().attr("src") ?? undefined;

  if (price == null && !description) return null;

  return {
    id: `grandtours-${tour.id}`,
    source: "grandtours.rs",
    sourceLabel: AGENCY,
    provider: "grandtours",
    title,
    location: title,
    country: undefined,
    agency: AGENCY,
    description,
    pricePerPerson: price,
    currency: "EUR",
    dateRange,
    transport: inferTransport(tags),
    accommodation: inferAccommodation(title, tags),
    image,
    sourceUrl: tour.link,
    tags: tags.length ? tags : ["Aranžman"],
  };
}

export async function searchGrandTours(params: SearchParams): Promise<Offer[]> {
  if (!findGrandToursTourTypes(params.destination) && !grandToursHitKeyword(params.destination)) {
    return [];
  }

  const tours = (await fetchAllTours()).filter((t) => matchesDestination(t, params.destination));
  const settled = await Promise.allSettled(tours.map((t) => fetchTourSnippet(t)));

  return settled
    .filter((r): r is PromiseFulfilledResult<Offer | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((o): o is Offer => o != null && o.pricePerPerson != null)
    .map((o) => ({ ...o, country: params.destination }));
}

export const grandToursProvider: Provider = {
  id: "grandtours",
  label: "Grand Tours",
  timeoutMs: 20000,
  search: searchGrandTours,
};
