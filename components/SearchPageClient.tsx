"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchForm from "@/components/SearchForm";
import FiltersPanel from "@/components/FiltersPanel";
import FiltersBar from "@/components/FiltersBar";
import ResultsGrid from "@/components/ResultsGrid";
import AiInsights from "@/components/AiInsights";
import DestinationBanner from "@/components/DestinationBanner";
import SearchProgress, {
  initialSearchProgress,
  type SearchProgressState,
} from "@/components/SearchProgress";
import SearchPanelSkeleton, { ResultsGridSkeleton } from "@/components/SearchLoading";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { formatGuests } from "@/lib/i18n/messages";
import type { SearchResult } from "@/lib/search";
import type { AiAnalysis, AiPick } from "@/lib/ai/analyze";
import {
  applyFilters,
  EMPTY_FILTERS,
  facetCounts,
  parseFilters,
  sortClient,
  writeFilters,
  type ClientSort,
  type OfferFilters,
} from "@/lib/filters";
import { resolveDestinationLocal } from "@/lib/destinations";
import { themeForCountry } from "@/lib/destination-themes";
import { externalSources } from "@/lib/external-sources";
import { isValidRange } from "@/lib/dates";
import { upcomingMonths } from "@/lib/months";
import { AlertTriangle, Info } from "lucide-react";

interface SearchPageClientProps {
  destination: string;
  month?: string;
  from?: string;
  to?: string;
  adults: number;
  childrenCount: number;
}

const CONTAINER = "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6";
const LAYOUT = "grid grid-cols-1 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6";
const SORTS: ClientSort[] = ["price-asc", "price-desc", "discount", "rating", "ai"];

function formatPeriod(locale: "sr" | "en", month?: string, from?: string, to?: string): string | undefined {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale === "en" ? "en-GB" : "sr-Latn-RS", {
      day: "numeric",
      month: "short",
    });
  };
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (month) return upcomingMonths(12, new Date(), locale).find((m) => m.value === month)?.label;
  return undefined;
}

export default function SearchPageClient({
  destination,
  month,
  from,
  to,
  adults,
  childrenCount: children,
}: SearchPageClientProps) {
  const { locale, t } = useAppPreferences();
  const searchParams = useSearchParams();
  const people = adults + children;
  const exact = isValidRange(from, to);

  const [progress, setProgress] = useState<SearchProgressState>(initialSearchProgress);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const completedRef = useRef(false);
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Novo skrejpovanje SAMO kad se promeni sama pretraga — filteri i
  // sortiranje rade nad već učitanim rezultatima.
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      destination,
      adults: String(adults),
      children: String(children),
    });
    if (exact) {
      params.set("from", from!);
      params.set("to", to!);
    } else {
      params.set("month", month ?? "any");
    }
    return params.toString();
  }, [destination, adults, children, month, from, to, exact]);

  useEffect(() => {
    completedRef.current = false;
    const source = new EventSource(`/api/search/stream?${queryString}`);

    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type?: string;
        error?: string;
        totalProviders?: number;
        completedProviders?: number;
        offersSoFar?: number;
        provider?: SearchProgressState["providers"][number];
        result?: SearchResult;
      };

      if (data.error) {
        setFetchError(data.error);
        source.close();
        return;
      }
      if (data.type === "start" && data.totalProviders != null) {
        setProgress({ ...initialSearchProgress, started: true, totalProviders: data.totalProviders });
        setResult(null);
        setFetchError(null);
        setAnalysis(null);
      }
      if (data.type === "provider") {
        setProgress((prev) => ({
          ...prev,
          started: true,
          totalProviders: data.totalProviders ?? prev.totalProviders,
          completedProviders: data.completedProviders ?? prev.completedProviders,
          offersSoFar: data.offersSoFar ?? prev.offersSoFar,
          providers: data.provider ? [...prev.providers, data.provider] : prev.providers,
        }));
      }
      if (data.type === "complete" && data.result) {
        completedRef.current = true;
        setResult(data.result);
        source.close();
      }
    };

    source.onerror = () => {
      if (!completedRef.current) setFetchError(tRef.current("search.fetchError"));
      source.close();
    };

    return () => source.close();
  }, [queryString]);

  // ── Filteri i sortiranje (stanje u URL-u, bez navigacije) ──
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const sortParam = searchParams.get("sort") as ClientSort | null;
  const sort: ClientSort = sortParam && SORTS.includes(sortParam) ? sortParam : analysis ? "ai" : "price-asc";

  const replaceParams = useCallback((next: URLSearchParams) => {
    window.history.replaceState(null, "", `?${next.toString()}`);
  }, []);

  const setFilters = useCallback(
    (next: OfferFilters) => replaceParams(writeFilters(new URLSearchParams(window.location.search), next)),
    [replaceParams]
  );

  const setSort = useCallback(
    (next: ClientSort) => {
      const params = new URLSearchParams(window.location.search);
      params.set("sort", next);
      replaceParams(params);
    },
    [replaceParams]
  );

  const aiPicks = useMemo(
    () => new Map<string, AiPick>((analysis?.picks ?? []).map((p) => [p.id, p])),
    [analysis]
  );
  const aiRank = useMemo(() => new Map([...aiPicks].map(([id, p]) => [id, p.rank])), [aiPicks]);

  const allOffers = useMemo(() => result?.offers ?? [], [result]);
  const facets = useMemo(() => facetCounts(allOffers), [allOffers]);
  const visible = useMemo(
    () => sortClient(applyFilters(allOffers, filters), sort, aiRank),
    [allOffers, filters, sort, aiRank]
  );

  const aiContext = useMemo(
    () => ({ destination, month: exact ? from?.slice(0, 7) : month, adults, children }),
    [destination, exact, from, month, adults, children]
  );

  // ── Tema i zaglavlje ──
  const resolvedLocal = useMemo(() => resolveDestinationLocal(destination), [destination]);
  const country = result?.destination?.country ?? resolvedLocal.country;
  const place = result?.destination?.place ?? resolvedLocal.place?.name;
  const theme = themeForCountry(country);
  const guestSummary = formatGuests(adults, children, locale);
  const periodLabel = formatPeriod(locale, exact ? undefined : month, exact ? from : undefined, exact ? to : undefined);
  const externalLinks = useMemo(
    () =>
      externalSources({
        query: result?.destination?.bookingQuery ?? resolvedLocal.bookingQuery,
        month,
        adults,
        children,
      }),
    [result, resolvedLocal, month, adults, children]
  );

  const searchBar = (
    <SearchForm
      variant="bar"
      defaultDestination={destination}
      defaultMonth={month}
      defaultFrom={from}
      defaultTo={to}
      defaultAdults={adults}
      defaultChildren={children}
    />
  );

  const banner = (
    <DestinationBanner
      theme={theme}
      title={place ?? country ?? destination}
      guests={guestSummary}
      period={periodLabel}
      place={place && country ? country : undefined}
    />
  );

  return (
    <div data-dest-theme={theme.id} className="lm-dest-page flex w-full flex-1 flex-col">
      <div className={CONTAINER}>
        {searchBar}
        {banner}

        {fetchError ? (
          <p className="lm-callout lm-callout--danger" role="alert">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {fetchError}
          </p>
        ) : !result ? (
          <div className={LAYOUT}>
            <SearchPanelSkeleton />
            <section className="flex min-w-0 flex-col gap-4">
              <SearchProgress progress={progress} />
              <ResultsGridSkeleton />
            </section>
          </div>
        ) : (
          <div className={LAYOUT}>
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              facets={facets}
              providerStatus={result.providerStatus}
              externalLinks={externalLinks}
            />

            <section className="flex min-w-0 flex-col gap-4">
              <AiInsights offers={visible} context={aiContext} onAnalysis={setAnalysis} />

              <FiltersBar
                shown={visible.length}
                total={allOffers.length}
                sort={sort}
                onSortChange={setSort}
                aiAvailable={aiPicks.size > 0}
              />

              {result.errors.length > 0 && (
                <div className="lm-callout lm-callout--warning">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p>
                      {t("search.sourcesPartial", {
                        sources: result.errors
                          .map((e) => result.providerStatus.find((p) => p.id === e.provider)?.label ?? e.provider)
                          .join(", "),
                      })}
                    </p>
                    <details className="mt-1 text-xs">
                      <summary className="cursor-pointer font-semibold">{t("search.errorDetails")}</summary>
                      <ul className="mt-1 flex flex-col gap-1">
                        {result.errors.map((e) => (
                          <li key={e.provider} className="break-words">
                            <b>{result.providerStatus.find((p) => p.id === e.provider)?.label ?? e.provider}:</b>{" "}
                            {e.message}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              )}

              {place && country && place !== country && (
                <p className="lm-callout lm-callout--info">
                  <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {t("results.placeHint", { country, place })}
                </p>
              )}

              {month && !exact && (
                <p className="lm-callout lm-callout--info">
                  <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {t("search.monthHint")}
                </p>
              )}

              <ResultsGrid
                offers={visible}
                people={people}
                aiPicks={aiPicks}
                filteredOut={allOffers.length > 0}
                onResetFilters={() => setFilters(EMPTY_FILTERS)}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
