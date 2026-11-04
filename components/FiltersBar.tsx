"use client";

import { Sparkles } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { MessageKey } from "@/lib/i18n/messages";
import type { ClientSort } from "@/lib/filters";

const SORT_OPTIONS: { value: ClientSort; labelKey: MessageKey }[] = [
  { value: "price-asc", labelKey: "filters.sortPriceAsc" },
  { value: "discount", labelKey: "filters.sortDiscount" },
  { value: "rating", labelKey: "filters.sortRating" },
  { value: "price-desc", labelKey: "filters.sortPriceDesc" },
];

export default function FiltersBar({
  shown,
  total,
  sort,
  onSortChange,
  aiAvailable,
}: {
  shown: number;
  total: number;
  sort: ClientSort;
  onSortChange: (sort: ClientSort) => void;
  aiAvailable: boolean;
}) {
  const { t } = useAppPreferences();
  const options = aiAvailable
    ? [{ value: "ai" as const, labelKey: "filters.sortAi" as const }, ...SORT_OPTIONS]
    : SORT_OPTIONS;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-muted" aria-live="polite">
        <span className="font-display text-xl font-bold tabular text-ink">{shown}</span>
        <span className="ml-1.5">
          {shown === total ? t("filters.offers") : `${t("filters.offers")} · ${t("filters.shown", { shown, total })}`}
        </span>
      </p>

      <div
        role="group"
        aria-label={t("filters.sort")}
        className="lm-seg max-w-full overflow-x-auto [scrollbar-width:none]"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={sort === opt.value}
            onClick={() => onSortChange(opt.value)}
            className="lm-seg__btn"
          >
            {opt.value === "ai" && <Sparkles size={13} aria-hidden />}
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
