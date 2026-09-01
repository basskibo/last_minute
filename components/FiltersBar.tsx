"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Select } from "@radix-ui/themes";
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
  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.labelKey ?? "filters.sort";

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-theme-muted">
        <span className="text-lg font-bold tabular-nums text-theme">{resultCount}</span>
        <span className="ml-1.5">{t("filters.offers")}</span>
      </p>

      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} className="text-theme-subtle" aria-hidden />
        <Select.Root value={currentSort} onValueChange={handleSortChange} size="2">
          <Select.Trigger
            className="field-theme !min-w-[9rem] !text-theme-muted"
            aria-label={`${t("filters.sort")}: ${t(currentLabel)}`}
          />
          <Select.Content>
            {SORT_OPTIONS.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
}
