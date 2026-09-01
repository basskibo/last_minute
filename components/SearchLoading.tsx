import OfferCardSkeleton from "./OfferCardSkeleton";

export default function SearchPanelSkeleton() {
  return (
    <section className="surface-card overflow-hidden rounded-2xl" aria-hidden>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
          <div className="skeleton-shimmer h-10 rounded-lg sm:col-span-1" />
          <div className="skeleton-shimmer h-10 rounded-lg sm:w-36" />
          <div className="skeleton-shimmer h-10 rounded-lg sm:w-20" />
          <div className="skeleton-shimmer h-10 rounded-lg sm:w-20" />
          <div className="skeleton-shimmer h-10 rounded-lg sm:w-28" />
        </div>
      </div>
      <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="skeleton-shimmer mb-2.5 h-3 w-24 rounded" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-8 w-28 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--border-muted)] bg-[color-mix(in_srgb,var(--surface)_30%,transparent)] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="skeleton-shimmer h-5 w-28 rounded" />
          <div className="skeleton-shimmer h-8 w-36 rounded-lg" />
        </div>
      </div>
    </section>
  );
}

export function ResultsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <OfferCardSkeleton
          key={i}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
