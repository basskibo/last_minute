import type { Offer } from "../providers/types";
import { boardTypes, discountPercent } from "../filters";
import { generateJson } from "./gemini";

export const AI_MAX_OFFERS = 60;

export interface AiRequest {
  locale: "sr" | "en";
  destination: string;
  month?: string;
  adults: number;
  children: number;
  /** Slobodan tekst: "mirno, blizu plaže, sa bazenom za decu" */
  preferences?: string;
  offers: Offer[];
}

export interface AiPick {
  id: string;
  rank: number;
  /** 0–100: koliko odgovara željama i koliko je dobra vrednost */
  score: number;
  reason: string;
}

export interface AiAnalysis {
  summary: string;
  picks: AiPick[];
  insights: string[];
  cautions: string[];
}

/** Kompaktan zapis ponude — manje tokena, samo ono što je bitno za izbor. */
function compact(o: Offer, people: number) {
  const ppp = o.pricePerPerson;
  return {
    id: o.id,
    title: o.title.slice(0, 90),
    where: o.location && o.location !== o.title ? o.location.slice(0, 60) : undefined,
    source: o.sourceLabel.slice(0, 40),
    eurPerPerson: ppp ?? undefined,
    eurTotal: ppp != null ? Math.round(ppp * people) : undefined,
    discountPct: Math.round(discountPercent(o)) || undefined,
    nights: o.nights,
    dates: o.dateRange,
    transport: o.transport.filter((t) => t !== "nepoznato"),
    stay: o.accommodation.filter((a) => a !== "nepoznato"),
    board: boardTypes(o),
    rating10: o.rating,
    reviews: o.reviewCount,
    rooms: o.roomOptions?.slice(0, 4).map((r) => `${r.label}: ${Math.round(r.price)}€`),
    info: o.description?.slice(0, 160),
  };
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    picks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          rank: { type: "INTEGER" },
          score: { type: "INTEGER" },
          reason: { type: "STRING" },
        },
        required: ["id", "rank", "score", "reason"],
      },
    },
    insights: { type: "ARRAY", items: { type: "STRING" } },
    cautions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "picks", "insights", "cautions"],
};

export async function analyzeOffers(req: AiRequest): Promise<AiAnalysis> {
  const people = req.adults + req.children;
  const offers = req.offers.slice(0, AI_MAX_OFFERS);
  const lang = req.locale === "en" ? "English" : "Serbian (Latin script)";

  const system = [
    "You are a sharp, honest travel deal analyst for a last-minute travel aggregator used in Serbia.",
    `Write everything in ${lang}. Be concrete: cite prices in EUR, nights, board, transport, ratings.`,
    "Only use facts present in the offers JSON. Never invent amenities, distances or prices.",
    "Rank the best matches for the traveler: weigh fit to their stated preferences first, then value for money",
    "(total price for the whole group, price per night, discount, board, included transport, guest rating).",
    "Booking/Airbnb prices are accommodation only (own transport); agency packages often include transport.",
    "Return 3–6 picks using ONLY ids from the input. `score` is 0–100. `reason` is one or two short sentences.",
    "`summary`: 2–3 sentences on the overall market (price range, what dominates, best timing).",
    "`insights`: 2–4 short tips (e.g. which source is cheapest, trade-offs). `cautions`: 0–3 short warnings",
    "(e.g. room too small for the group, price is per person, unclear dates). Keep every string under 280 characters.",
  ].join(" ");

  const prompt = JSON.stringify({
    trip: {
      destination: req.destination,
      month: req.month ?? "flexible",
      adults: req.adults,
      children: req.children,
      preferences: req.preferences?.slice(0, 400) || "none given",
    },
    offers: offers.map((o) => compact(o, people)),
  });

  const result = await generateJson<AiAnalysis>({ system, prompt, schema: SCHEMA });

  const known = new Set(offers.map((o) => o.id));
  const picks = (result.picks ?? [])
    .filter((p) => known.has(p.id))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6)
    .map((p, i) => ({
      id: p.id,
      rank: i + 1,
      score: Math.max(0, Math.min(100, Math.round(p.score))),
      reason: String(p.reason).slice(0, 300),
    }));

  return {
    summary: String(result.summary ?? "").slice(0, 600),
    picks,
    insights: (result.insights ?? []).map(String).slice(0, 4).map((s) => s.slice(0, 300)),
    cautions: (result.cautions ?? []).map(String).slice(0, 3).map((s) => s.slice(0, 300)),
  };
}
