import * as cheerio from "cheerio";
import type { AccommodationType, Offer, Provider, RoomOption, SearchParams, TransportType } from "./types";
import { findArgusLetovanjeSlug } from "./agency-destinations";
import { fetchHtml, parsePriceEur } from "./scrape-utils";

const BASE_URL = "https://argus.rs";
const AGENCY = "ArgusTours";

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
  if (t.includes("apartman") || t.includes("studio")) return ["apartman"];
  return ["nepoznato"];
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s*od\s*\d+€.*$/i, "").replace(/\s+/g, " ").trim();
}

function parseSummaryCards(html: string, country: string, sectionTransport: TransportType[]): Offer[] {
  const $ = cheerio.load(html);
  const offers: Offer[] = [];

  $(".card.shadow-sm.h-100").each((_, el) => {
    const $card = $(el);
    const href = $card.find("a").first().attr("href");
    if (!href) return;

    const bodyText = $card.find(".card-body").text().replace(/\s+/g, " ").trim();
    const priceText = $card.find(".text-secondary").text().trim();
    const price = parsePriceEur(priceText);
    const title = cleanTitle(bodyText);
    if (!title) return;

    const transport = inferTransport(bodyText);
    const finalTransport = transport[0] === "nepoznato" ? sectionTransport : transport;

    offers.push({
      id: `argus-summary-${href}`.replace(/\s+/g, "-").slice(0, 160),
      source: "argus.rs",
      sourceLabel: AGENCY,
      provider: "argus",
      title,
      location: title,
      country,
      agency: AGENCY,
      pricePerPerson: price,
      currency: "EUR",
      transport: finalTransport,
      accommodation: inferAccommodation(bodyText),
      sourceUrl: new URL(href, BASE_URL).toString(),
      tags: ["Od"],
    });
  });

  return offers;
}

function parseDetailTables(html: string, country: string, regionPath: string): Offer[] {
  const $ = cheerio.load(html);
  const offers: Offer[] = [];
  const pageTransport = inferTransport($.text());

  $("#offer table.table").each((_, table) => {
    const $table = $(table);
    const dateHeaders = $table
      .find("thead th")
      .slice(2)
      .map((_, th) => $(th).html()?.replace(/<br\s*\/?>/gi, "–") ?? "")
      .get()
      .map((h) => cheerio.load(h).text().replace(/\s+/g, " ").trim())
      .filter(Boolean);

    let currentProperty = "";
    let currentPropertyHref = "";
    let currentRoom = "";

    $table.find("tbody tr").each((_, tr) => {
      const $tr = $(tr);
      const propLink = $tr.find("h3 a").first();
      if (propLink.length) {
        currentProperty = propLink.text().replace(/\s+/g, " ").trim();
        currentPropertyHref = propLink.attr("href") ?? "";
        return;
      }

      const roomHeader = $tr.find("th.fw-medium").first().text().replace(/\s+/g, " ").trim();
      if (roomHeader && !roomHeader.includes("po osobi")) {
        currentRoom = roomHeader;
        return;
      }

      if (!$tr.text().includes("po osobi")) return;

      const roomOptions: RoomOption[] = [];
      $tr.find("td").each((i, td) => {
        const $td = $(td);
        const priceText = $td.text().trim();
        const price = parsePriceEur(priceText);
        if (price == null) return;
        const dateRange = dateHeaders[i - 2] ?? `Termin ${i}`;
        roomOptions.push({ label: `${currentRoom} (${dateRange})`, price });
      });
      if (roomOptions.length === 0) return;

      const minPrice = Math.min(...roomOptions.map((r) => r.price));
      const idBase = `${regionPath}-${currentProperty}-${currentRoom}`.replace(/\s+/g, "-");

      offers.push({
        id: `argus-${idBase}`.slice(0, 160),
        source: "argus.rs",
        sourceLabel: AGENCY,
        provider: "argus",
        title: `${currentProperty} – ${currentRoom}`,
        location: currentProperty,
        country,
        agency: AGENCY,
        pricePerPerson: minPrice,
        currency: "EUR",
        transport: pageTransport[0] === "nepoznato" ? ["autobus"] : pageTransport,
        accommodation: inferAccommodation(`${currentProperty} ${currentRoom}`),
        roomOptions: roomOptions.sort((a, b) => a.price - b.price),
        sourceUrl: currentPropertyHref
          ? new URL(currentPropertyHref, BASE_URL).toString()
          : new URL(regionPath, BASE_URL).toString(),
        tags: ["Cenovnik"],
      });
    });
  });

  return offers;
}

export async function searchArgus(params: SearchParams): Promise<Offer[]> {
  const slug = findArgusLetovanjeSlug(params.destination);
  if (!slug) return [];

  const countryPath = `/aranzmani/letovanje/${slug}`;
  const html = await fetchHtml(`${BASE_URL}${countryPath}`);
  const $ = cheerio.load(html);

  const offers: Offer[] = [];

  $(".aranzmani-podkategorija-box").each((_, section) => {
    const $section = $(section);
    const transportLabel =
      $section.find(".aranzmani-podkategorija-prevoz h2, .aranzmani-podkategorija-prevoz h3").first().text() ||
      $section.prevAll(".aranzmani-podkategorija-prevoz").first().text();
    const sectionTransport = inferTransport(transportLabel);
    const sectionHtml = $.html($section);
    offers.push(...parseSummaryCards(sectionHtml, params.destination, sectionTransport));
  });

  if (offers.length === 0) {
    offers.push(...parseSummaryCards(html, params.destination, ["nepoznato"]));
  }

  const detailPaths = [
    ...new Set(
      offers
        .map((o) => {
          try {
            const u = new URL(o.sourceUrl);
            return u.pathname;
          } catch {
            return null;
          }
        })
        .filter((p): p is string => Boolean(p && p !== countryPath && p.startsWith(countryPath)))
    ),
  ].slice(0, 8);

  const detailResults = await Promise.allSettled(
    detailPaths.map(async (path) => {
      const detailHtml = await fetchHtml(`${BASE_URL}${path}`);
      return parseDetailTables(detailHtml, params.destination, path);
    })
  );

  detailResults.forEach((result) => {
    if (result.status === "fulfilled") offers.push(...result.value);
  });

  return offers;
}

export const argusProvider: Provider = {
  id: "argus",
  label: "ArgusTours",
  search: searchArgus,
};
