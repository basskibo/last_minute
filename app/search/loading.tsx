import { Suspense } from "react";
import SearchLoadingView from "@/components/SearchLoadingView";
import SearchPanelSkeleton, {
  ResultsGridSkeleton,
  SearchBarSkeleton,
} from "@/components/SearchLoading";

function LoadingFallback() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <SearchBarSkeleton />
      <div className="skeleton-shimmer h-10 w-56 rounded-lg" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <SearchPanelSkeleton />
        <ResultsGridSkeleton />
      </div>
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
