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

export interface SearchProgressEvent {
  type: "start" | "provider" | "complete";
  totalProviders: number;
  completedProviders?: number;
  offersSoFar?: number;
  provider?: ProviderStatus & { failed?: boolean };
  result?: SearchResult;
}

function finalizeSearchResult(
  params: SearchParams,
  sort: SortOption,
  providerFilter: string[] | undefined,
  merged: Offer[],
  providerStatus: ProviderStatus[],
  errors: SearchResult["errors"],
  cached: boolean
): SearchResult {
  const filtered =
    providerFilter && providerFilter.length > 0
      ? merged.filter((o) => providerFilter.includes(o.provider))
      : merged;
  const offers = prioritizeMonth(sortOffers(filtered, sort), params.month);
  return { offers, cached, errors, providerStatus };
}

export async function performSearch(
  params: SearchParams,
  sort: SortOption = "price-asc",
  providerFilter?: string[]
): Promise<SearchResult> {
  return performSearchStreaming(params, sort, providerFilter, () => {});
}

export async function performSearchStreaming(
  params: SearchParams,
  sort: SortOption = "price-asc",
  providerFilter: string[] | undefined,
  emit: (event: SearchProgressEvent) => void
): Promise<SearchResult> {
  const totalProviders = providers.length;
  emit({ type: "start", totalProviders });

  const cacheKey = buildCacheKey(params);
  const cached = await getCached<CachedPayload>(cacheKey);
  if (cached) {
    let offersSoFar = 0;
    cached.providerStatus.forEach((provider, i) => {
      offersSoFar += provider.count;
      emit({
        type: "provider",
        totalProviders,
        completedProviders: i + 1,
        offersSoFar,
        provider,
      });
    });

    const result = finalizeSearchResult(
      params,
      sort,
      providerFilter,
      cached.offers,
      cached.providerStatus,
      [],
      true
    );
    emit({ type: "complete", totalProviders, result });
    return result;
  }

  const perProviderResults: Offer[][] = new Array(totalProviders);
  const errors: SearchResult["errors"] = [];
  const providerStatus: ProviderStatus[] = new Array(totalProviders);
  let completedProviders = 0;
  let offersSoFar = 0;

  await Promise.all(
    providers.map((provider, index) =>
      withTimeout(provider.search(params), provider.timeoutMs ?? 8000)
        .then((offers) => {
          perProviderResults[index] = offers;
          const status: ProviderStatus = {
            id: provider.id,
            label: provider.label,
            count: offers.length,
            note: provider.note,
          };
          providerStatus[index] = status;
          completedProviders++;
          offersSoFar += offers.length;
          emit({
            type: "provider",
            totalProviders,
            completedProviders,
            offersSoFar,
            provider: status,
          });
        })
        .catch((reason) => {
          perProviderResults[index] = [];
          errors.push({
            provider: provider.id,
            message: String((reason as Error)?.message ?? reason),
          });
          const status: ProviderStatus = {
            id: provider.id,
            label: provider.label,
            count: 0,
            note: provider.note,
          };
          providerStatus[index] = status;
          completedProviders++;
          emit({
            type: "provider",
            totalProviders,
            completedProviders,
            offersSoFar,
            provider: { ...status, failed: true },
          });
        })
    )
  );

  const merged = mergeOffers(perProviderResults);
  await setCached<CachedPayload>(cacheKey, { offers: merged, providerStatus });

  const result = finalizeSearchResult(
    params,
    sort,
    providerFilter,
    merged,
    providerStatus,
    errors,
    false
  );
  emit({ type: "complete", totalProviders, result });
  return result;
}
