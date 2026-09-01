"use client";

import { useSearchParams } from "next/navigation";
import SearchProgress, { initialSearchProgress } from "@/components/SearchProgress";
import SearchPanelSkeleton, { ResultsGridSkeleton } from "@/components/SearchLoading";

/** Fallback dok se server shell učitava — pravi progress preuzima SearchPageClient. */
export default function SearchLoadingView() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination")?.trim();

  if (!destination) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
        <SearchPanelSkeleton />
        <ResultsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="label-caps">Rezultati pretrage</p>
        <h1 className="text-2xl font-bold tracking-tight text-theme sm:text-3xl">
          {destination}
        </h1>
      </header>
      <SearchProgress progress={initialSearchProgress} />
      <SearchPanelSkeleton />
      <ResultsGridSkeleton />
    </div>
  );
}
