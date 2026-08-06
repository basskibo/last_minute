import type { Offer } from "./providers/types";
import { monthNameSr } from "./months";

export function mergeOffers(results: Offer[][]): Offer[] {
  // Dedup po id-u (ne sourceUrl-u): kod izvora poput Oktopoda isti smeštaj
  // (isti sourceUrl) legitimno ima više ponuda za različite periode
  // polaska — sourceUrl bi ih pogrešno spojio u jednu.
  const seen = new Set<string>();
  const merged: Offer[] = [];
  for (const offers of results) {
    for (const offer of offers) {
      if (seen.has(offer.id)) continue;
      seen.add(offer.id);
      merged.push(offer);
    }
  }
  return merged;
}

export type SortOption = "price-asc" | "price-desc" | "discount";

function discountPercent(offer: Offer): number {
  if (!offer.oldPricePerPerson || !offer.pricePerPerson) return 0;
  return ((offer.oldPricePerPerson - offer.pricePerPerson) / offer.oldPricePerPerson) * 100;
}

export function sortOffers(offers: Offer[], sort: SortOption = "price-asc"): Offer[] {
  const withPrice = offers.filter((o) => o.pricePerPerson != null);
  const withoutPrice = offers.filter((o) => o.pricePerPerson == null);

  const sorted = [...withPrice].sort((a, b) => {
    if (sort === "price-desc") return (b.pricePerPerson ?? 0) - (a.pricePerPerson ?? 0);
    if (sort === "discount") return discountPercent(b) - discountPercent(a);
    return (a.pricePerPerson ?? 0) - (b.pricePerPerson ?? 0);
  });

  return [...sorted, ...withoutPrice];
}

/**
 * Ne filtrira striktno (već smo videli da precizno filtriranje po datumu
 * lako zna da izbriše sve rezultate zbog nejasne semantike izvora) — samo
 * gura ponude čiji vidljivi termin pominje izabrani mesec na vrh, dok
 * ostale ostaju ispod, zadržavajući prethodni redosled sortiranja.
 */
export function prioritizeMonth(offers: Offer[], month?: string): Offer[] {
  const monthName = monthNameSr(month);
  if (!monthName) return offers;
  const needle = monthName.toLowerCase();

  const matching = offers.filter((o) => o.dateRange?.toLowerCase().includes(needle));
  const rest = offers.filter((o) => !o.dateRange?.toLowerCase().includes(needle));
  return [...matching, ...rest];
}
