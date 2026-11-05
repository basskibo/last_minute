import type { Offer } from "../providers/types";
import { boardTypes, discountPercent, nightsCount } from "../filters";
import type { AiAnalysis, AiRequest } from "./analyze";

/**
 * Rezervni "automatski izbor" kad Gemini nije dostupan (preopterećen,
 * limit, timeout). Bez AI-ja: transparentan skor iz podataka ponude.
 *
 * Skor (0–100):
 * - cena po osobi po noćenju u odnosu na ostale ponude (do 45 poena)
 * - popust (do 20), ocena gostiju (do 20)
 * - ishrana (all inclusive > pun > polupansion > doručak, do 10)
 * - uključen organizovan prevoz (5)
 */

const BOARD_POINTS: Record<string, number> = { ai: 10, fb: 8, hb: 6, bb: 3, ro: 0 };

function perNight(o: Offer): number | null {
  if (o.pricePerPerson == null) return null;
  const n = nightsCount(o);
  return n && n > 0 ? o.pricePerPerson / n : o.pricePerPerson;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

export function heuristicAnalysis(req: AiRequest): AiAnalysis {
  const en = req.locale === "en";
  const offers = req.offers.filter((o) => o.pricePerPerson != null);
  const people = req.adults + req.children;
  if (offers.length === 0) {
    return {
      summary: en ? "No offers with a price to compare." : "Nema ponuda sa cenom za poređenje.",
      picks: [],
      insights: [],
      cautions: [],
    };
  }

  const nightly = offers.map(perNight).filter((v): v is number => v != null);
  const minN = Math.min(...nightly);
  const maxN = Math.max(...nightly);

  const scored = offers.map((o) => {
    const pn = perNight(o) ?? maxN;
    const priceScore = maxN > minN ? 45 * (1 - (pn - minN) / (maxN - minN)) : 30;
    const disc = Math.min(20, discountPercent(o) / 2);
    const rating = o.rating != null ? Math.max(0, (o.rating - 6) * 5) : 8;
    const board = Math.max(0, ...boardTypes(o).map((b) => BOARD_POINTS[b] ?? 0));
    const transport = o.transport.some((t) => t === "avion" || t === "autobus") ? 5 : 0;
    const score = Math.round(Math.min(100, priceScore + disc + rating + board + transport));
    return { o, score, disc: Math.round(discountPercent(o)), board: boardTypes(o)[0] };
  });

  const picks = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s, i) => {
      const total = Math.round((s.o.pricePerPerson ?? 0) * people);
      const parts: string[] = [
        en ? `${total} € total for ${people}` : `${total} € ukupno za ${people}`,
      ];
      if (s.disc > 0) parts.push(en ? `${s.disc}% off` : `${s.disc}% popusta`);
      if (s.o.rating != null) parts.push(en ? `rated ${s.o.rating.toFixed(1)}` : `ocena ${s.o.rating.toFixed(1)}`);
      if (s.board === "ai") parts.push("all inclusive");
      if (s.o.transport.includes("avion")) parts.push(en ? "flight included" : "avion uključen");
      else if (s.o.transport.includes("autobus")) parts.push(en ? "bus included" : "autobus uključen");
      return { id: s.o.id, rank: i + 1, score: s.score, reason: `${parts.join(" · ")}.` };
    });

  const prices = offers.map((o) => o.pricePerPerson as number);
  const min = Math.round(Math.min(...prices));
  const med = Math.round(median(prices));
  const discounted = offers.filter((o) => discountPercent(o) > 0).length;
  const bySource = new Map<string, number>();
  for (const o of offers) {
    const prev = bySource.get(o.sourceLabel);
    if (prev == null || (o.pricePerPerson as number) < prev) bySource.set(o.sourceLabel, o.pricePerPerson as number);
  }
  const cheapestSource = [...bySource.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];

  return {
    summary: en
      ? `${offers.length} offers from ${min} € per person (median ${med} €). ${discounted} are discounted. Picks below are ranked automatically by price per night, discount, rating, board and included transport.`
      : `${offers.length} ponuda od ${min} € po osobi (medijana ${med} €), ${discounted} sa popustom. Izbor ispod je automatski rangiran po ceni po noćenju, popustu, oceni, ishrani i uključenom prevozu.`,
    picks,
    insights: cheapestSource
      ? [en ? `Cheapest source right now: ${cheapestSource}.` : `Najjeftiniji izvor trenutno: ${cheapestSource}.`]
      : [],
    cautions: [
      en
        ? "Booking/Airbnb prices are accommodation only — add transport when comparing with agency packages."
        : "Booking/Airbnb cene su samo smeštaj — dodaj prevoz kad porediš sa paketima agencija.",
    ],
  };
}
