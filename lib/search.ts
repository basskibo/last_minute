import { providers } from "./providers";
import type { Offer, SearchParams } from "./providers/types";
import { buildCacheKey, getCached, setCached } from "./cache";
import { mergeOffers, prioritizeMonth, sortOffers, type SortOption } from "./normalize";
import { offerMentionsPlace, type DestinationEntry } from "./destinations";
import { resolveDestination } from "./ai/resolve-destination";
import { monthOf } from "./dates";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`isteklo vreme (${Math.round(ms / 1000)} s)`)), ms)
    ),
  ]);
}

export interface ProviderStatus {
  id: string;
  label: string;
  count: number;
  note?: string;
  /** Poruka greške ako izvor nije uspeo (prikazuje se u UI-ju) */
  error?: string;
}

interface CachedPayload {
  offers: Offer[];
  providerStatus: ProviderStatus[];
  destination?: ResolvedDestinationInfo;
}

/**
 * Ne filtrira: ponude koje pominju traženo mesto (npr. "Barselona" kad
 * agencije vrate celu Španiju) idu na vrh, ostale ostaju ispod.
 */
function prioritizePlace(offers: Offer[], place?: DestinationEntry): Offer[] {
  if (!place) return offers;
  const text = (o: Offer) => [o.title, o.location, o.description].filter(Boolean).join(" ");
  const matching = offers.filter((o) => o.provider === "booking" || o.provider === "airbnb" || offerMentionsPlace(text(o), place));
  const rest = offers.filter((o) => !matching.includes(o));
  return [...matching, ...rest];
}

export interface ResolvedDestinationInfo {
  query: string;
  /** Država za agencijske izvore, ako je prepoznata */
  country?: string;
  /** Mesto unutar države (Barselona), ako je traženo mesto a ne država */
  place?: string;
  /** Engleski naziv za međunarodne sajtove ("Barcelona, Spain") */
  bookingQuery?: string;
}

export interface SearchResult {
  offers: Offer[];
  destination?: ResolvedDestinationInfo;
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
  cached: boolean,
  destination?: ResolvedDestinationInfo,
  place?: DestinationEntry
): SearchResult {
  const filtered =
    providerFilter && providerFilter.length > 0
      ? merged.filter((o) => providerFilter.includes(o.provider))
      : merged;
  const offers = prioritizePlace(prioritizeMonth(sortOffers(filtered, sort), params.month ?? monthOf(params.checkin)), place);
  return { offers, cached, errors, providerStatus, destination };
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
  const resolved = await resolveDestination(params.destination);
  const destination: ResolvedDestinationInfo = {
    query: params.destination,
    country: resolved.country,
    place: resolved.place?.name,
    bookingQuery: resolved.bookingQuery,
  };
  const countryParams: SearchParams = { ...params, destination: resolved.country ?? params.destination };
  const placeParams: SearchParams = { ...params, bookingQuery: resolved.bookingQuery };
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
      true,
      destination,
      resolved.place
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
      withTimeout(
        provider.search(provider.scope === "place" ? placeParams : countryParams),
        provider.timeoutMs ?? 8000
      )
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
          // Vidljivo u Vercel → Logs; poruka ide i u UI (lista izvora).
          console.error(`[search] ${provider.id} failed:`, reason);
          perProviderResults[index] = [];
          // Playwright dodaje višeredni "Call log" sa ANSI kodovima — samo prvi red.
          const message = String((reason as Error)?.message ?? reason)
            .split("\n")[0]
            .replace(/\u001b\[[0-9;]*m/g, "")
            .slice(0, 240);
          errors.push({ provider: provider.id, message });
          const status: ProviderStatus = {
            id: provider.id,
            label: provider.label,
            count: 0,
            note: provider.note,
            error: message,
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
  // Ako je neki izvor pao (npr. Booking timeout), ne zaključavamo taj
  // nepotpun rezultat na 3 sata — ponovni pokušaj već posle 10 minuta.
  await setCached<CachedPayload>(
    cacheKey,
    { offers: merged, providerStatus, destination },
    errors.length > 0 ? 60 * 10 : undefined
  );

  const result = finalizeSearchResult(
    params,
    sort,
    providerFilter,
    merged,
    providerStatus,
    errors,
    false,
    destination,
    resolved.place
  );
  emit({ type: "complete", totalProviders, result });
  return result;
}
