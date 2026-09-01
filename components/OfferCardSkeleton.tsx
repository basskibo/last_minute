import type { CSSProperties } from "react";

export default function OfferCardSkeleton({
  style,
}: {
  style?: CSSProperties;
}) {
  return (
    <div
      className="surface-card overflow-hidden rounded-2xl"
      style={style}
      aria-hidden
    >
      <div className="aspect-[5/4] sm:aspect-[4/3] skeleton-shimmer" />
      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-4 w-[85%] rounded-md" />
        <div className="skeleton-shimmer h-3 w-[55%] rounded-md" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-5 w-20 rounded-full" />
          <div className="skeleton-shimmer h-5 w-14 rounded-full" />
        </div>
        <div className="skeleton-shimmer mt-1 h-[4.5rem] w-full rounded-xl" />
      </div>
    </div>
  );
}
