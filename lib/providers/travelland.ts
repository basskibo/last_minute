import * as cheerio from "cheerio";
import type { AccommodationType, Offer, Provider, SearchParams, TransportType } from "./types";
import { findTravellandCountryId } from "./agency-destinations";
import { fetchHtml, parsePriceEur } from "./scrape-utils";

const BASE_URL = "https://www.travelland.rs";
const AGENCY = "Travelland";

function inferTransport(text: string): TransportType[] {
  const t = text.toLowerCase();
  if (t.includes("avion")) return ["avion"];
  if (t.includes("autobus")) return ["autobus"];
  if (t.includes("sopstveni")) return ["sopstveni"];
  return ["nepoznato"];
}

function inferAccommodation(text: string): AccommodationType[] {
  const t = text.toLowerCase();
  if (t.includes("hotel")) return ["hotel"];
  if (t.includes("apartman")) return ["apartman"];
  return ["nepoznato"];
}

interface ListResponse {
  html: string;
  total: number;
}

async function fetchList(countryId: number, perPage = 40): Promise<ListResponse> {
  const url = new URL(`${BASE_URL}/services/list/`);
  url.searchParams.set("ajax", "1");
  url.searchParams.set("objectGroupId", "1");
  url.searchParams.set("dynamicPackage", "1");
  url.searchParams.set("countryId", String(countryId));
  url.searchParams.set("perPage", String(perPage));
  url.searchParams.set("sortBy", "11:DESC");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "sr-RS,sr;q=0.9,en;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`travelland.rs HTTP ${res.status}`);
  return res.json() as Promise<ListResponse>;
}

function parseCards(html: string, country: string): Offer[] {
  const $ = cheerio.load(html);
  const offers: Offer[] = [];

  $("a.card-accommodation, a.card").each((_, el) => {
    const $card = $(el);
    const href = $card.attr("href");
    if (!href) return;

    const title = $card
      .find("[id^='description-'] h4, h4.title, .title, h4")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const priceText = $card.find(".unit-price-total").text().trim() || $card.text();
    const price = parsePriceEur(priceText);
    const oldPriceText = $card.find(".unit-price-old, del").first().text().trim();
    const bodyText = $card.text().replace(/\s+/g, " ").trim();

    const departures = $card
      .find(".departure")
      .map((_, d) => $(d).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 6);

    const locationParts = $card
      .find(".location, .breadcrumb, .subtitle")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const idMatch = bodyText.match(/\d{10}\s*-\s*\d+/);
    const nightsMatch = bodyText.match(/(\d+)\s*noć/i);

    offers.push({
      id: `travelland-${href.replace(/\//g, "-")}`.slice(0, 160),
      source: "travelland.rs",
      sourceLabel: AGENCY,
      provider: "travelland",
      title: title || "Ponuda",
      location: locationParts || title || country,
      country,
      agency: AGENCY,
      pricePerPerson: price,
      oldPricePerPerson: parsePriceEur(oldPriceText),
      currency: "EUR",
      nights: nightsMatch?.[0],
      dateRange: departures.length ? `Polasci: ${departures.join(", ")}` : undefined,
      transport: inferTransport(bodyText),
      accommodation: inferAccommodation(bodyText),
      image: $card.find("img[data-src], img[src]").first().attr("data-src") ?? undefined,
      sourceUrl: new URL(href, BASE_URL).toString(),
      tags: idMatch ? ["Paket aranžman"] : ["Paket aranžman"],
    });
  });

  return offers;
}

export async function searchTravelland(params: SearchParams): Promise<Offer[]> {
  const countryId = findTravellandCountryId(params.destination);
  if (!countryId) return [];

  const { html } = await fetchList(countryId);
  return parseCards(html, params.destination);
}

export const travellandProvider: Provider = {
  id: "travelland",
  label: "Travelland",
  search: searchTravelland,
};
