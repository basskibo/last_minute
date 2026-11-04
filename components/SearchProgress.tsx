"use client";

import { Check, Loader2, X } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { ProviderStatus } from "@/lib/search";

export interface SearchProgressState {
  totalProviders: number;
  completedProviders: number;
  offersSoFar: number;
  providers: (ProviderStatus & { failed?: boolean })[];
  started: boolean;
}

export const initialSearchProgress: SearchProgressState = {
  totalProviders: 0,
  completedProviders: 0,
  offersSoFar: 0,
  providers: [],
  started: false,
};

export default function SearchProgress({ progress }: { progress: SearchProgressState }) {
  const { t } = useAppPreferences();
  const { totalProviders, completedProviders, offersSoFar, providers, started } = progress;
  const pct =
    totalProviders > 0 ? Math.round((completedProviders / totalProviders) * 100) : 0;

  return (
    <div className="lm-panel flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-ink">{t("progress.searching")}</p>
          {started && totalProviders > 0 ? (
            <p className="text-sm text-ink-muted">
              <span className="font-semibold tabular text-ink">{completedProviders}</span>
              {" "}/ {totalProviders} {t("progress.agencies")}
              <span className="mx-2 text-ink-subtle">·</span>
              <span className="font-semibold tabular text-primary">{offersSoFar}</span>{" "}
              {t("progress.offers")}
            </p>
          ) : (
            <p className="text-sm text-ink-subtle">{t("progress.starting")}</p>
          )}
        </div>
      </div>

      <div
        className="lm-progress"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="lm-progress__fill"
          style={{ width: `${Math.max(pct, started ? 4 : 0)}%` }}
        />
      </div>

      {providers.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <li
              key={p.id}
              className={`lm-badge ${p.failed ? "bg-deal-soft text-danger" : "lm-badge--neutral"}`}
            >
              {p.failed ? (
                <X size={12} className="shrink-0" aria-hidden />
              ) : (
                <Check size={12} className="shrink-0 text-primary" aria-hidden />
              )}
              {p.label}
              <span className="font-mono tabular text-ink-subtle">{p.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
