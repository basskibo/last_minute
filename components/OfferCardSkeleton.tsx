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
      <div className="h-44 skeleton-shimmer" />
      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-4 w-[85%] rounded-md" />
        <div className="skeleton-shimmer h-3 w-[50%] rounded-md" />
        <div className="skeleton-shimmer h-3 w-[35%] rounded-md" />
        <div className="mt-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-end justify-between">
            <div className="skeleton-shimmer h-3 w-20 rounded" />
            <div className="skeleton-shimmer h-7 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
