import OfferCardSkeleton from "./OfferCardSkeleton";

/** Skeleton bočnog panela sa izvorima. */
export default function SearchPanelSkeleton() {
  return (
    <aside className="lm-panel space-y-3 p-5" aria-hidden>
      <div className="skeleton-shimmer h-4 w-28 rounded" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton-shimmer h-[18px] w-[18px] rounded-[5px]" />
          <div className="skeleton-shimmer h-3.5 flex-1 rounded" />
        </div>
      ))}
    </aside>
  );
}

export function SearchBarSkeleton() {
  return <div className="skeleton-shimmer h-[60px] w-full rounded-[var(--radius-pill)]" aria-hidden />;
}

export function ResultsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <OfferCardSkeleton key={i} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}
