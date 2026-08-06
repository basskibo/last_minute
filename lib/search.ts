import { providers } from "./providers";
import type { Offer, SearchParams } from "./providers/types";
import { buildCacheKey, getCached, setCached } from "./cache";
import { mergeOffers, prioritizeMonth, sortOffers, type SortOption } from "./normalize";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export interface ProviderStatus {
  id: string;
  label: string;
  count: number;
  note?: string;
}

interface CachedPayload {
  offers: Offer[];
  providerStatus: ProviderStatus[];
}

export interface SearchResult {
  offers: Offer[];
  cached: boolean;
  errors: { provider: string; message: string }[];
  providerStatus: ProviderStatus[];
}

/**
 * providerFilter utiče samo na PRIKAZ (koji izvori se vrate u offers), ne na
 * to koji izvori se zapravo pretražuju/keširaju — keš uvek sadrži rezultate
 * svih izvora za tu destinaciju, tako da promena filtera ne pokreće ponovo
 * spor headless-browser scraping za Booking/Airbnb.
 */
export async function performSearch(
  params: SearchParams,
  sort: SortOption = "price-asc",
  providerFilter?: string[]
): Promise<SearchResult> {
  const cacheKey = buildCacheKey(params);
  const cached = await getCached<CachedPayload>(cacheKey);
  if (cached) {
    const filtered =
      providerFilter && providerFilter.length > 0
        ? cached.offers.filter((o) => providerFilter.includes(o.provider))
        : cached.offers;
    const offers = prioritizeMonth(sortOffers(filtered, sort), params.month);
    return { offers, cached: true, errors: [], providerStatus: cached.providerStatus };
  }

  const settled = await Promise.allSettled(
    providers.map((p) => withTimeout(p.search(params), p.timeoutMs ?? 8000))
  );

  const perProviderResults: Offer[][] = [];
  const errors: { provider: string; message: string }[] = [];
  const providerStatus: ProviderStatus[] = [];

  settled.forEach((result, i) => {
    const provider = providers[i];
    if (result.status === "fulfilled") {
      perProviderResults.push(result.value);
      providerStatus.push({
        id: provider.id,
        label: provider.label,
        count: result.value.length,
        note: provider.note,
      });
    } else {
      perProviderResults.push([]);
      errors.push({
        provider: provider.id,
        message: String((result.reason as Error)?.message ?? result.reason),
      });
      providerStatus.push({
        id: provider.id,
        label: provider.label,
        count: 0,
        note: provider.note,
      });
    }
  });

  const merged = mergeOffers(perProviderResults);
  await setCached<CachedPayload>(cacheKey, { offers: merged, providerStatus });

  const filtered =
    providerFilter && providerFilter.length > 0
      ? merged.filter((o) => providerFilter.includes(o.provider))
      : merged;
  const offers = prioritizeMonth(sortOffers(filtered, sort), params.month);
  return { offers, cached: false, errors, providerStatus };
}
