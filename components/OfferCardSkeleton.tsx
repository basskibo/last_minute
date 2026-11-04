import type { CSSProperties } from "react";

export default function OfferCardSkeleton({ style }: { style?: CSSProperties }) {
  return (
    <div className="lm-panel overflow-hidden" style={style} aria-hidden>
      <div className="skeleton-shimmer aspect-[16/10]" />
      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-4 w-[85%] rounded-md" />
        <div className="skeleton-shimmer h-3 w-[55%] rounded-md" />
        <div className="flex gap-1.5">
          <div className="skeleton-shimmer h-[22px] w-16 rounded-lg" />
          <div className="skeleton-shimmer h-[22px] w-14 rounded-lg" />
        </div>
        <div className="mt-2 border-t border-line pt-3">
          <div className="flex items-end justify-between">
            <div className="skeleton-shimmer h-3 w-20 rounded" />
            <div className="skeleton-shimmer h-8 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
