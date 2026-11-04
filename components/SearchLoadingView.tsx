"use client";

import { useSearchParams } from "next/navigation";
import SearchProgress, { initialSearchProgress } from "@/components/SearchProgress";
import SearchPanelSkeleton, {
  ResultsGridSkeleton,
  SearchBarSkeleton,
} from "@/components/SearchLoading";
import { useAppPreferences } from "@/components/providers/AppProviders";

/** Fallback dok se server shell učitava — pravi progress preuzima SearchPageClient. */
export default function SearchLoadingView() {
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();
  const destination = searchParams.get("destination")?.trim();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <SearchBarSkeleton />
      <header className="space-y-1.5">
        <p className="lm-label">{t("search.resultsLabel")}</p>
        {destination ? (
          <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
            {destination}
          </h1>
        ) : (
          <div className="skeleton-shimmer h-10 w-56 rounded-lg" />
        )}
      </header>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <SearchPanelSkeleton />
        <section className="flex min-w-0 flex-col gap-5">
          {destination && <SearchProgress progress={initialSearchProgress} />}
          <ResultsGridSkeleton />
        </section>
      </div>
    </div>
  );
}
