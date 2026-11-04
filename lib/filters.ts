import type { Offer } from "./providers/types";
import { normalizeText } from "./destinations";

/**
 * Filteri rade na klijentu nad već učitanim rezultatima — promena filtera
 * ili sortiranja ne pokreće novo skrejpovanje. Stanje živi u URL-u (može
 * da se podeli link).
 */

export type BoardType = "ai" | "fb" | "hb" | "bb" | "ro";
export type NightsBucket = "short" | "week" | "long";
export type ClientSort = "price-asc" | "price-desc" | "discount" | "rating" | "ai";

export interface OfferFilters {
  priceMin?: number;
  priceMax?: number;
  transport: string[];
  accommodation: string[];
  board: BoardType[];
  nights: NightsBucket[];
  discountOnly: boolean;
  minRating?: number;
  q: string;
  /** null = svi izvori */
  providers: string[] | null;
}

export const EMPTY_FILTERS: OfferFilters = {
  transport: [],
  accommodation: [],
  board: [],
  nights: [],
  discountOnly: false,
  q: "",
  providers: null,
};

const BOARD_PATTERNS: [BoardType, RegExp][] = [
  ["ai", /all[\s-]*inclusive|ultra all|\buai\b/i],
  ["fb", /pun pansion|puni pansion|full board|\bfb\b/i],
  ["hb", /polupansion|polu pansion|half board|\bhb\b/i],
  ["bb", /doru[cč]a?k|breakfast|\bbb\b|\bnd\b/i],
  ["ro", /room only|bez ishrane|samo sme[sš]taj|\bro\b/i],
];

export function boardTypes(offer: Offer): BoardType[] {
  const text = [
    offer.title,
    offer.description,
    ...offer.tags,
    ...(offer.roomOptions?.map((r) => r.label) ?? []),
  ]
    .filter(Boolean)
    .join(" ");
  return BOARD_PATTERNS.filter(([, re]) => re.test(text)).map(([t]) => t);
}

export function nightsCount(offer: Offer): number | null {
  const match = offer.nights?.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function nightsBucket(offer: Offer): NightsBucket | null {
  const n = nightsCount(offer);
  if (n == null) return null;
  if (n <= 4) return "short";
  if (n <= 8) return "week";
  return "long";
}

export function discountPercent(offer: Offer): number {
  if (!offer.oldPricePerPerson || !offer.pricePerPerson) return 0;
  const pct = ((offer.oldPricePerPerson - offer.pricePerPerson) / offer.oldPricePerPerson) * 100;
  return pct > 0 ? pct : 0;
}

/** Filteri iz URL-a. */
export function parseFilters(sp: URLSearchParams): OfferFilters {
  const list = (key: string) => (sp.get(key) ? sp.get(key)!.split(",").filter(Boolean) : []);
  const num = (key: string) => {
    const v = sp.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const providers = list("providers");
  return {
    priceMin: num("pmin"),
    priceMax: num("pmax"),
    transport: list("tr"),
    accommodation: list("acc"),
    board: list("board") as BoardType[],
    nights: list("n") as NightsBucket[],
    discountOnly: sp.get("disc") === "1",
    minRating: num("rating"),
    q: sp.get("q") ?? "",
    providers: providers.length ? providers : null,
  };
}

/** Upisuje filtere u kopiju URL parametara (ostale parametre zadržava). */
export function writeFilters(sp: URLSearchParams, f: OfferFilters): URLSearchParams {
  const next = new URLSearchParams(sp.toString());
  const set = (key: string, value: string | undefined) => {
    if (value) next.set(key, value);
    else next.delete(key);
  };
  set("pmin", f.priceMin != null ? String(f.priceMin) : undefined);
  set("pmax", f.priceMax != null ? String(f.priceMax) : undefined);
  set("tr", f.transport.join(","));
  set("acc", f.accommodation.join(","));
  set("board", f.board.join(","));
  set("n", f.nights.join(","));
  set("disc", f.discountOnly ? "1" : undefined);
  set("rating", f.minRating != null ? String(f.minRating) : undefined);
  set("q", f.q.trim() || undefined);
  set("providers", f.providers?.join(","));
  return next;
}

export function activeFilterCount(f: OfferFilters): number {
  return (
    (f.priceMin != null ? 1 : 0) +
    (f.priceMax != null ? 1 : 0) +
    f.transport.length +
    f.accommodation.length +
    f.board.length +
    f.nights.length +
    (f.discountOnly ? 1 : 0) +
    (f.minRating != null ? 1 : 0) +
    (f.q.trim() ? 1 : 0) +
    (f.providers ? 1 : 0)
  );
}

export function applyFilters(offers: Offer[], f: OfferFilters): Offer[] {
  const q = normalizeText(f.q);
  return offers.filter((o) => {
    if (f.providers && !f.providers.includes(o.provider)) return false;
    const price = o.pricePerPerson;
    if (f.priceMin != null && (price == null || price < f.priceMin)) return false;
    if (f.priceMax != null && (price == null || price > f.priceMax)) return false;
    if (f.transport.length && !o.transport.some((t) => f.transport.includes(t))) return false;
    if (f.accommodation.length && !o.accommodation.some((a) => f.accommodation.includes(a))) return false;
    if (f.board.length && !boardTypes(o).some((b) => f.board.includes(b))) return false;
    if (f.nights.length) {
      const bucket = nightsBucket(o);
      if (!bucket || !f.nights.includes(bucket)) return false;
    }
    if (f.discountOnly && discountPercent(o) <= 0) return false;
    if (f.minRating != null && (o.rating == null || o.rating < f.minRating)) return false;
    if (q) {
      const text = normalizeText(
        [o.title, o.location, o.description, o.sourceLabel, ...o.tags].filter(Boolean).join(" ")
      );
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

/** Sortiranje; `aiRank` = id → mesto u AI preporuci (1 = najbolje). */
export function sortClient(offers: Offer[], sort: ClientSort, aiRank?: Map<string, number>): Offer[] {
  const withPrice = offers.filter((o) => o.pricePerPerson != null);
  const withoutPrice = offers.filter((o) => o.pricePerPerson == null);
  const byPrice = (a: Offer, b: Offer) => (a.pricePerPerson ?? 0) - (b.pricePerPerson ?? 0);

  if (sort === "ai" && aiRank && aiRank.size) {
    return [...offers].sort((a, b) => {
      const ra = aiRank.get(a.id) ?? Infinity;
      const rb = aiRank.get(b.id) ?? Infinity;
      if (ra !== rb) return ra - rb;
      return byPrice(a, b);
    });
  }

  const sorted = [...withPrice].sort((a, b) => {
    if (sort === "price-desc") return byPrice(b, a);
    if (sort === "discount") return discountPercent(b) - discountPercent(a) || byPrice(a, b);
    if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1) || byPrice(a, b);
    return byPrice(a, b);
  });
  return [...sorted, ...withoutPrice];
}

/** Broj ponuda po vrednosti filtera (za brojače pored opcija). */
export function facetCounts(offers: Offer[]) {
  const count = <K extends string>(keys: (o: Offer) => K[]) => {
    const map = new Map<K, number>();
    for (const o of offers) for (const k of new Set(keys(o))) map.set(k, (map.get(k) ?? 0) + 1);
    return map;
  };
  const prices = offers.map((o) => o.pricePerPerson).filter((p): p is number => p != null);
  return {
    transport: count((o) => o.transport),
    accommodation: count((o) => o.accommodation),
    board: count(boardTypes),
    nights: count((o) => {
      const b = nightsBucket(o);
      return b ? [b] : [];
    }),
    discounted: offers.filter((o) => discountPercent(o) > 0).length,
    rated: offers.filter((o) => o.rating != null).length,
    priceMin: prices.length ? Math.floor(Math.min(...prices)) : 0,
    priceMax: prices.length ? Math.ceil(Math.max(...prices)) : 0,
  };
}
