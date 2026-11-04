"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { MessageKey } from "@/lib/i18n/messages";

const SORT_OPTIONS: { value: string; labelKey: MessageKey }[] = [
  { value: "price-asc", labelKey: "filters.sortPriceAsc" },
  { value: "price-desc", labelKey: "filters.sortPriceDesc" },
  { value: "discount", labelKey: "filters.sortDiscount" },
];

export default function FiltersBar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();
  const currentSort = searchParams.get("sort") || "price-asc";

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-muted">
        <span className="font-display text-xl font-bold tabular text-ink">{resultCount}</span>
        <span className="ml-1.5">{t("filters.offers")}</span>
      </p>

      <div
        role="group"
        aria-label={t("filters.sort")}
        className="lm-seg max-w-full overflow-x-auto [scrollbar-width:none]"
      >
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={currentSort === opt.value}
            onClick={() => handleSortChange(opt.value)}
            className="lm-seg__btn"
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
