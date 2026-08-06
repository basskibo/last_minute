import * as cheerio from "cheerio";
import type { AccommodationType, Offer, Provider, SearchParams, TransportType } from "./types";
import { findLmpCountryId } from "./lmp-countries";

const BASE_URL = "https://www.lastminuteponude.com";

function parsePrice(text: string | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\./g, "").replace(/\s/g, "");
  const match = cleaned.match(/(\d+(?:,\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

function mapTransport(alt: string): TransportType | null {
  const a = alt.toLowerCase();
  if (a.includes("avion")) return "avion";
  if (a.includes("autobus")) return "autobus";
  if (a.includes("sopstveni")) return "sopstveni";
  return null;
}

function mapAccommodation(alt: string): AccommodationType | null {
  const a = alt.toLowerCase();
  if (a.includes("hotel")) return "hotel";
  if (a.includes("apartman") || a.includes("studio")) return "apartman";
  return null;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "sr-RS,sr;q=0.9,en;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`lastminuteponude.com HTTP ${res.status}`);
  return res.text();
}

export async function searchLastMinutePonude(params: SearchParams): Promise<Offer[]> {
  const countryId = findLmpCountryId(params.destination);
  if (!countryId) return [];

  // Napomena: sajt ima "od"/"do" filter polja, ali njihova stvarna logika
  // poklapanja termina nije očigledna iz UI-ja (isprobano: širok, validan
  // period datuma vrati 0 rezultata iako postojeće ponude vidno upadaju u
  // taj period). Zato ih namerno ne šaljemo — vraćamo sve trenutne last
  // minute ponude za državu, a tačan datum polaska je vidljiv na kartici
  // pa korisnik sam proceni poklapanje sa željenim periodom.
  const url = new URL(`${BASE_URL}/ponude.php`);
  url.searchParams.set("tip", "2"); // last minute
  url.searchParams.set("drzava", String(countryId));

  const html = await fetchHtml(url.toString());
  const $ = cheerio.load(html);

  const offers: Offer[] = [];

  $('ul.wide-list > li[id^="ponuda_rezultat_"]').each((_, el) => {
    const $el = $(el);
    const id = $el.attr("id")?.replace("ponuda_rezultat_", "") ?? String(offers.length);

    const detailHref = $el.find("li.thumb a.thumb").attr("href") ?? "";
    const image = $el.find("li.thumb img").attr("src") ?? "";
    const titleEm = $el.find("h4 em").first().text().trim();
    const subtitle = $el.find("h4 small").first().text().replace(/^-\s*/, "").trim();
    const termLine = $el.find("h5").first().text().trim();
    const description = $el.find("li:has(h4) > p").first().text().trim();

    const agencyTitle = $el.find('a[title^="Turistička agencija"]').first().attr("title");
    const agency = agencyTitle?.replace("Turistička agencija", "").trim();

    const oldPriceText = $el.find(".old-price strong").first().text();
    const newPriceText = $el.find(".new-price strong").first().text();

    const tags = $el
      .find("li.tipovi ul li a")
      .map((_, t) => $(t).text().trim())
      .get();

    const transportSet = new Set<TransportType>();
    const accommodationSet = new Set<AccommodationType>();
    $el.find("li.option-multi img").each((_, img) => {
      const alt = $(img).attr("alt") ?? "";
      const t = mapTransport(alt);
      const a = mapAccommodation(alt);
      if (t) transportSet.add(t);
      if (a) accommodationSet.add(a);
    });

    const [datePart, nightsPart] = termLine.replace("Termin polaska:", "").split("|");

    offers.push({
      id: `lmp-${id}`,
      source: "lastminuteponude.com",
      sourceLabel: agency ? `${agency} (preko lastminuteponude.com)` : "lastminuteponude.com",
      provider: "lastminuteponude",
      title: titleEm || subtitle || "Ponuda",
      location: titleEm || params.destination,
      country: params.destination,
      agency,
      description: description || undefined,
      pricePerPerson: parsePrice(newPriceText),
      oldPricePerPerson: parsePrice(oldPriceText),
      currency: "EUR",
      nights: nightsPart?.trim(),
      dateRange: datePart?.trim(),
      transport: transportSet.size ? Array.from(transportSet) : ["nepoznato"],
      accommodation: accommodationSet.size ? Array.from(accommodationSet) : ["nepoznato"],
      image: image ? new URL(image, BASE_URL).toString() : undefined,
      sourceUrl: detailHref ? new URL(detailHref, BASE_URL).toString() : BASE_URL,
      tags,
    });
  });

  return offers;
}

export const lastMinutePonudeProvider: Provider = {
  id: "lastminuteponude",
  label: "Last Minute Ponude (srpske agencije)",
  search: searchLastMinutePonude,
};
