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
import type { SearchResult } from "@/lib/search";
import type { SortOption } from "@/lib/normalize";
import { Callout } from "@radix-ui/themes";
import { AlertTriangle, Info, Users } from "lucide-react";

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
  const people = adults + children;
  const [progress, setProgress] = useState<SearchProgressState>(initialSearchProgress);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const completedRef = useRef(false);

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
        setFetchError("Pretraga nije uspela — probaj ponovo.");
      }
      source.close();
    };

    return () => source.close();
  }, [queryString]);

  if (fetchError) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Callout.Root color="ruby" variant="soft">
          <Callout.Text>{fetchError}</Callout.Text>
        </Callout.Root>
        <SearchForm
          variant="bar"
          defaultDestination={destination}
          defaultMonth={month}
          defaultAdults={adults}
          defaultChildren={children}
        />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <header className="space-y-1">
          <p className="label-caps">Rezultati pretrage</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-theme sm:text-3xl">
              {destination}
            </h1>
            <p className="chip-inactive !inline-flex items-center gap-1.5 !py-1">
              <Users size={13} className="text-primary" />
              {adults} odrasl{adults === 1 ? "a" : "ih"}
              {children > 0 && ` · ${children} dete${children === 1 ? "" : "ta"}`}
            </p>
          </div>
        </header>

        <SearchProgress progress={progress} />
        <SearchPanelSkeleton />
        <ResultsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="label-caps">Rezultati pretrage</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-theme sm:text-3xl">
            {destination}
          </h1>
          <p className="chip-inactive !inline-flex items-center gap-1.5 !py-1">
            <Users size={13} className="text-primary" />
            {adults} odrasl{adults === 1 ? "a" : "ih"}
            {children > 0 && ` · ${children} dete${children === 1 ? "" : "ta"}`}
          </p>
        </div>
      </header>

      <SearchPanel
        destination={destination}
        month={month}
        adults={adults}
        children={children}
        providerStatus={result.providerStatus}
        resultCount={result.offers.length}
      />

      {result.errors.length > 0 && (
        <Callout.Root color="amber" variant="soft" className="!rounded-xl">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>
            Neki izvori trenutno nisu dostupni ({result.errors.map((e) => e.provider).join(", ")})
            — prikazani su rezultati iz ostalih izvora.
          </Callout.Text>
        </Callout.Root>
      )}

      {month && (
        <Callout.Root color="gray" variant="soft" className="!rounded-xl">
          <Callout.Icon>
            <Info size={16} />
          </Callout.Icon>
          <Callout.Text>
            Izabrani mesec služi kao orijentir — ponude koje ga pominju su na vrhu, ali
            prikazujemo i ostale jer se last minute termini stalno menjaju.
          </Callout.Text>
        </Callout.Root>
      )}

      <ResultsGrid offers={result.offers} people={people} />
    </div>
  );
}
