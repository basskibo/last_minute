import { Suspense } from "react";
import SearchLoadingView from "@/components/SearchLoadingView";
import SearchPanelSkeleton, { ResultsGridSkeleton } from "@/components/SearchLoading";

function LoadingFallback() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
      <SearchPanelSkeleton />
      <ResultsGridSkeleton />
    </div>
  );
}

export default function Loading() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchLoadingView />
    </Suspense>
  );
}
