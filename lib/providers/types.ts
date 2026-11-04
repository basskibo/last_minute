export type TransportType = "avion" | "autobus" | "sopstveni" | "nepoznato";
export type AccommodationType = "hotel" | "apartman" | "nepoznato";

export interface SearchParams {
  /** Naziv države/destinacije, npr. "Grčka" */
  destination: string;
  /** Fleksibilan period, format "yyyy-mm" (npr. "2026-08"), opciono */
  month?: string;
  /** Tačni datumi (ISO yyyy-mm-dd), opciono — imaju prednost nad `month` */
  checkin?: string;
  checkout?: string;
  adults: number;
  children: number;
  /**
   * Naziv za Booking/Airbnb (engleski, sa državom: "Barcelona, Spain").
   * Popunjava ga lib/search.ts; provajderi sa scope "place" ga koriste
   * umesto `destination`.
   */
  bookingQuery?: string;
}

export interface RoomOption {
  /** Oznaka sobnosti, npr. "1/3 APT" */
  label: string;
  price: number;
  /** true = cena uključuje organizovan prevoz, false = sopstveni prevoz/najam bez prevoza */
  transportIncluded?: boolean;
}

export interface Offer {
  id: string;
  source: string;
  sourceLabel: string;
  provider: string;
  title: string;
  location?: string;
  country?: string;
  agency?: string;
  description?: string;
  pricePerPerson: number | null;
  oldPricePerPerson?: number | null;
  currency: string;
  nights?: string;
  dateRange?: string;
  transport: TransportType[];
  accommodation: AccommodationType[];
  /** Cene po tipu sobe/apartmana, kad izvor daje granularniju tabelu (npr. Oktopod) */
  roomOptions?: RoomOption[];
  image?: string;
  sourceUrl: string;
  tags: string[];
  /** Ocena gostiju na skali 0–10 (Booking direktno, Airbnb ×2) */
  rating?: number;
  /** Broj recenzija, ako ga izvor daje */
  reviewCount?: number;
}

export interface ProviderResult {
  provider: string;
  offers: Offer[];
  error?: string;
}

export interface Provider {
  id: string;
  label: string;
  /** Kratko objašnjenje ako izvor trenutno ne vraća rezultate (npr. blokiran scraping) */
  note?: string;
  /** Timeout za ovaj izvor u ms — headless-browser izvori su sporiji od običnog fetch-a (default 8000) */
  timeoutMs?: number;
  /**
   * "country" (podrazumevano): izvor pretražuje po državi, pa dobija
   * razrešenu državu (Barselona → Španija). "place": izvor razume bilo
   * koje mesto (Booking, Airbnb).
   */
  scope?: "country" | "place";
  search(params: SearchParams): Promise<Offer[]>;
}
