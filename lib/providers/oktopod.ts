import * as cheerio from "cheerio";
import type { Offer, Provider, RoomOption, SearchParams, TransportType } from "./types";
import { fetchHtml, firstImageSrc } from "./scrape-utils";

const BASE_URL = "https://www.oktopod.rs";
const OKTOPOD_IMAGE = /\/uploaded_pictures\/content\/putovanja\//;

function extractOktopodCover(html: string): string | undefined {
  return firstImageSrc(html, BASE_URL, OKTOPOD_IMAGE);
}

/**
 * Oktopod nema jedinstvenu, parametrizovanu pretragu po državi — svaka
 * "last minute" kampanja je posebna, ručno napravljena stranica, i samo
 * neke od njih imaju strukturiranu tabelu cena (ostale su PDF/najava bez
 * parsabilnih podataka). Mapiramo samo potvrđene stranice sa tabelom.
 */
const OKTOPOD_PAGES: Record<string, string> = {
  Grčka: "/sr/strana/last-minute-grcka-apartmani",
};

// Ikonice u ćelijama cena: kombi/autobus = organizovan prevoz uključen u cenu,
// automobil = sopstveni prevoz / najam smeštaja bez prevoza.
const BUS_ICON = "\u{1F68D}"; // 🚍
const CAR_ICON = "\u{1F697}"; // 🚗

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/\./g, "").replace(/\s/g, "");
  const match = cleaned.match(/(\d+(?:,\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatRoomLabel(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().replace(/(\d)([A-Za-zČĆŠĐŽčćšđž])/, "$1 $2");
}

function cleanVilaName(raw: string): { name: string; tags: string[] } {
  const tags: string[] = [];
  let name = raw;

  const discountMatch = name.match(/POPUST\s*(\d+)\s*%/i);
  if (discountMatch) {
    tags.push(`Popust ${discountMatch[1]}%`);
    name = name.replace(discountMatch[0], "");
  }

  if (/POSLEDNJA\s*SOBA/i.test(name)) {
    tags.push("Poslednja soba");
    name = name.replace(/POSLEDNJA\s*SOBA/i, "");
  }

  return { name: toTitleCase(name.replace(/\s+/g, " ").trim()), tags };
}

interface OktopodDraft extends Offer {
  vilaHref?: string;
}

export async function searchOktopod(params: SearchParams): Promise<Offer[]> {
  const path = Object.entries(OKTOPOD_PAGES).find(
    ([name]) => name.toLowerCase() === params.destination.trim().toLowerCase()
  )?.[1];
  if (!path) return [];

  const html = await fetchHtml(`${BASE_URL}${path}`);
  const $ = cheerio.load(html);

  const drafts: OktopodDraft[] = [];

  $(".date-section").each((_, section) => {
    const $section = $(section);
    const dateHeader = $section
      .find(".date-header")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const nightsMatch = dateHeader.match(/(\d+\s*noćenja)/i);
    const nights = nightsMatch?.[1];
    const dateRange = (nights ? dateHeader.replace(nights, "") : dateHeader).trim();

    $section.find("table.lm-table").each((_, table) => {
      const $table = $(table);

      // Prve dve kolone su "Mesto"/"Smeštaj", ostale su tipovi soba (npr. "1/3 APT")
      const roomLabels = $table
        .find("thead th")
        .slice(2)
        .map((_, th) => formatRoomLabel($(th).text()))
        .get();

      let currentLocation = "";

      $table.find("tbody tr").each((_, tr) => {
        const $tr = $(tr);
        const locCell = $tr.find("td.location-cell");
        if (locCell.length) {
          currentLocation = toTitleCase(locCell.text().replace(/\s+/g, " ").trim());
        }

        const vilaLink = $tr.find("td.vila-name a");
        const vilaRaw = vilaLink.text().replace(/\s+/g, " ").trim();
        const vilaHref = vilaLink.attr("href");
        if (!vilaRaw) return;

        // Mora da obuhvati i "empty-cell" (prazne "-") kolone, ne samo
        // "price-cell", jer se indeks kolone koristi za uparivanje sa
        // zaglavljem (roomLabels) — preskakanje praznih kolona bi pomerilo
        // uparivanje cena sa pogrešnim tipom sobe kad neka kolona nema cenu.
        const roomOptions: RoomOption[] = [];
        $tr.find("td.price-cell, td.empty-cell").each((i, td) => {
          const $td = $(td);
          const price = parsePrice($td.text());
          if (price == null) return;

          const iconText = $td.find(".lm-transport-icon").text();
          const transportIncluded = iconText.includes(BUS_ICON)
            ? true
            : iconText.includes(CAR_ICON)
              ? false
              : undefined;

          roomOptions.push({
            label: roomLabels[i] ?? `Opcija ${i + 1}`,
            price,
            transportIncluded,
          });
        });
        if (roomOptions.length === 0) return;

        const minPrice = Math.min(...roomOptions.map((r) => r.price));

        const transportSet = new Set<TransportType>();
        roomOptions.forEach((r) => {
          if (r.transportIncluded === true) transportSet.add("autobus");
          if (r.transportIncluded === false) transportSet.add("sopstveni");
        });

        const { name: vilaName, tags } = cleanVilaName(vilaRaw);
        const id = vilaHref
          ? `oktopod-${vilaHref}-${dateRange}`
          : `oktopod-${currentLocation}-${vilaName}-${dateRange}`;

        drafts.push({
          id: id.replace(/\s+/g, "-").slice(0, 160),
          source: "oktopod.rs",
          sourceLabel: "Oktopod travel",
          provider: "oktopod",
          title: `${vilaName} (${currentLocation})`,
          location: `${vilaName} (${currentLocation})`,
          country: params.destination,
          agency: "Oktopod travel",
          pricePerPerson: minPrice,
          oldPricePerPerson: null,
          currency: "EUR",
          nights,
          dateRange,
          transport: transportSet.size ? Array.from(transportSet) : ["nepoznato"],
          accommodation: ["apartman"],
          roomOptions: roomOptions.sort((a, b) => a.price - b.price),
          sourceUrl: vilaHref ? new URL(vilaHref, BASE_URL).toString() : `${BASE_URL}${path}`,
          tags: ["Last minute", ...tags],
          vilaHref: vilaHref ?? undefined,
        });
      });
    });
  });

  const uniqueVilaHrefs = [
    ...new Set(drafts.map((d) => d.vilaHref).filter((h): h is string => Boolean(h))),
  ].slice(0, 20);

  const imageByHref = new Map<string, string | undefined>();
  await Promise.allSettled(
    uniqueVilaHrefs.map(async (href) => {
      const html = await fetchHtml(new URL(href, BASE_URL).toString());
      imageByHref.set(href, extractOktopodCover(html));
    })
  );

  return drafts.map(({ vilaHref, ...offer }) => ({
    ...offer,
    image: vilaHref ? imageByHref.get(vilaHref) : undefined,
  }));
}

export const oktopodProvider: Provider = {
  id: "oktopod",
  label: "Oktopod travel",
  search: searchOktopod,
};
