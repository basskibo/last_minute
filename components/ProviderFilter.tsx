"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { ProviderStatus } from "@/lib/search";

export default function ProviderFilter({
  providerStatus,
}: {
  providerStatus: ProviderStatus[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();

  const activeRaw = searchParams.get("providers");
  const active = activeRaw ? activeRaw.split(",") : null;

  function toggle(id: string) {
    const current = active ?? providerStatus.map((p) => p.id);
    const next = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id];

    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0 || next.length === providerStatus.length) {
      params.delete("providers");
    } else {
      params.set("providers", next.join(","));
    }
    router.push(`/search?${params.toString()}`);
  }

  if (providerStatus.length === 0) return null;

  const activeCount = active ? active.length : providerStatus.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{t("providers.label")}</h2>
        <span className="font-mono text-xs tabular text-ink-subtle">
          {activeCount}/{providerStatus.length} {t("providers.active")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
        {providerStatus.map((p) => {
          const isActive = active ? active.includes(p.id) : true;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              title={p.note}
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
