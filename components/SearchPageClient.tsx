"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchForm from "@/components/SearchForm";
import SearchPanel from "@/components/SearchPanel";
import ResultsGrid from "@/components/ResultsGrid";
import SearchProgress, {
  initialSearchProgress,
  type SearchProgressState,
} from "@/components/SearchProgress";
import SearchPanelSkeleton, { ResultsGridSkeleton } from "@/components/SearchLoading";
import FiltersBar from "@/components/FiltersBar";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { formatGuests } from "@/lib/i18n/messages";
import type { SearchResult } from "@/lib/search";
import type { SortOption } from "@/lib/normalize";
import { Callout } from "@radix-ui/themes";
import { AlertTriangle, Info, Users } from "lucide-react";

const CONTAINER =
  "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8";
const LAYOUT = "grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8";

interface SearchPageClientProps {
  destination: string;
  month?: string;
  adults: number;
  children: number;
  sort: SortOption;
  providerFilter?: string[];
}

export default function SearchPageClient({
  destination,
  month,
  adults,
  children,
  sort,
  providerFilter,
}: SearchPageClientProps) {
  const { locale, t } = useAppPreferences();
  const people = adults + children;
  const [progress, setProgress] = useState<SearchProgressState>(initialSearchProgress);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const completedRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      destination,
      adults: String(adults),
      children: String(children),
      sort,
      month: month ?? "any",
    });
    if (providerFilter?.length) {
      params.set("providers", providerFilter.join(","));
    }
    return params.toString();
  }, [destination, adults, children, sort, month, providerFilter]);

  useEffect(() => {
    completedRef.current = false;
    setProgress(initialSearchProgress);
    setResult(null);
    setFetchError(null);

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
        setProgress((prev) => ({
          ...prev,
          started: true,
          totalProviders: data.totalProviders!,
        }));
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
      if (!completedRef.current) {
        setFetchError(tRef.current("search.fetchError"));
      }
      source.close();
    };

    return () => source.close();
  }, [queryString]);

  const guestSummary = formatGuests(adults, children, locale);

  const searchBar = (
    <SearchForm
      variant="bar"
      defaultDestination={destination}
      defaultMonth={month}
      defaultAdults={adults}
      defaultChildren={children}
    />
  );

  const pageHeader = (
    <header className="space-y-1.5">
      <p className="lm-label">{t("search.resultsLabel")}</p>
      <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
        {destination}
      </h1>
      <p className="inline-flex items-center gap-1.5 text-[15px] text-ink-muted">
        <Users size={15} className="text-primary" aria-hidden />
        {guestSummary}
      </p>
    </header>
  );

  if (fetchError) {
    return (
      <div className={CONTAINER}>
        {searchBar}
        <Callout.Root color="ruby" variant="soft" className="!rounded-xl">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>{fetchError}</Callout.Text>
        </Callout.Root>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={CONTAINER}>
        {searchBar}
        {pageHeader}
        <div className={LAYOUT}>
          <SearchPanelSkeleton />
          <section className="flex min-w-0 flex-col gap-5">
            <SearchProgress progress={progress} />
            <ResultsGridSkeleton />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={CONTAINER}>
      {searchBar}
      {pageHeader}

      <div className={LAYOUT}>
        <SearchPanel providerStatus={result.providerStatus} />

        <section className="flex min-w-0 flex-col gap-5">
          <FiltersBar resultCount={result.offers.length} />

          {result.errors.length > 0 && (
            <Callout.Root color="amber" variant="soft" className="!rounded-xl">
              <Callout.Icon>
                <AlertTriangle size={16} />
              </Callout.Icon>
              <Callout.Text>
                {t("search.sourcesPartial", {
                  sources: result.errors.map((e) => e.provider).join(", "),
                })}
              </Callout.Text>
            </Callout.Root>
          )}

          {month && (
            <Callout.Root color="gray" variant="soft" className="!rounded-xl">
              <Callout.Icon>
                <Info size={16} />
              </Callout.Icon>
              <Callout.Text>{t("search.monthHint")}</Callout.Text>
            </Callout.Root>
          )}

          <ResultsGrid offers={result.offers} people={people} />
        </section>
      </div>
    </div>
  );
}
