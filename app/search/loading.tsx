import SearchPanelSkeleton, { ResultsGridSkeleton } from "@/components/SearchLoading";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-2">
        <div className="skeleton-shimmer h-3 w-32 rounded" />
        <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
      </header>

      <div className="flex items-center gap-2 text-sm text-sky-400/90">
        <Loader2 size={16} className="animate-spin" />
        <span className="animate-pulse">Pretražujemo ponude sa agencija…</span>
      </div>

      <SearchPanelSkeleton />
      <ResultsGridSkeleton />
    </div>
  );
}
