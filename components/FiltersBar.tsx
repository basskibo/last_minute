"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Select } from "@radix-ui/themes";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "price-asc", label: "Najjeftinije" },
  { value: "price-desc", label: "Najskuplje" },
  { value: "discount", label: "Najveći popust" },
];

export default function FiltersBar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "price-asc";
  const currentLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Sortiraj";

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-theme-muted">
        <span className="text-lg font-bold tabular-nums text-theme">{resultCount}</span>
        <span className="ml-1.5">ponuda</span>
      </p>

      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} className="text-theme-subtle" aria-hidden />
        <Select.Root value={currentSort} onValueChange={handleSortChange} size="2">
          <Select.Trigger
            className="field-theme !min-w-[9rem] !text-theme-muted"
            aria-label={`Sortiraj: ${currentLabel}`}
          />
          <Select.Content>
            {SORT_OPTIONS.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
}
