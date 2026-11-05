"use client";

import { Check } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { ProviderStatus } from "@/lib/search";

/** Lista izvora sa checkboxovima. `selected` null = svi izvori. */
export default function ProviderFilter({
  providerStatus,
  selected,
  onChange,
}: {
  providerStatus: ProviderStatus[];
  selected: string[] | null;
  onChange: (next: string[] | null) => void;
}) {
  const { t } = useAppPreferences();
  if (providerStatus.length === 0) return null;

  function toggle(id: string) {
    const current = selected ?? providerStatus.map((p) => p.id);
    const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    onChange(next.length === 0 || next.length === providerStatus.length ? null : next);
  }

  const activeCount = selected ? selected.length : providerStatus.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="lm-filter__title">{t("providers.label")}</h3>
        <span className="font-mono text-xs tabular text-ink-subtle">
          {activeCount}/{providerStatus.length} {t("providers.active")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
        {providerStatus.map((p) => {
          const isActive = selected ? selected.includes(p.id) : true;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              title={p.error ?? p.note ?? p.label}
              aria-pressed={isActive}
              className={`lm-check ${p.count === 0 ? "text-ink-subtle" : ""}`}
            >
              <span className="lm-check__box" aria-hidden>
                {isActive && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="truncate">{p.label}</span>
              <span className="lm-check__count tabular">{p.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
