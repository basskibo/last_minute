"use client";

import { Check, Loader2, X } from "lucide-react";
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
  const { totalProviders, completedProviders, offersSoFar, providers, started } = progress;
  const pct =
    totalProviders > 0 ? Math.round((completedProviders / totalProviders) * 100) : 0;

  return (
    <div className="surface-card space-y-4 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-primary" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-theme-muted">
            Pretražujemo ponude sa agencija…
          </p>
          {started && totalProviders > 0 ? (
            <p className="text-sm text-theme-muted">
              <span className="font-semibold tabular-nums text-theme">
                {completedProviders}
              </span>
              <span> / {totalProviders} agencija</span>
              <span className="mx-2 text-theme-subtle">·</span>
              <span className="font-semibold tabular-nums text-primary">{offersSoFar}</span>
              <span> ponuda</span>
            </p>
          ) : (
            <p className="text-sm text-theme-subtle">Pokrećemo pretragu…</p>
          )}
        </div>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-fill"
          style={{ width: `${Math.max(pct, started ? 4 : 0)}%` }}
        />
      </div>

      {providers.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <li
              key={p.id}
              className={
                p.failed
                  ? "inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-2.5 py-1 text-xs font-medium text-danger ring-1 ring-[color-mix(in_srgb,var(--danger)_25%,transparent)]"
                  : "chip-inactive !inline-flex items-center gap-1.5 !py-1 !px-2.5"
              }
            >
              {p.failed ? (
                <X size={11} className="shrink-0" />
              ) : (
                <Check size={11} className="shrink-0 text-primary" />
              )}
              {p.label}
              <span className="tabular-nums text-theme-subtle">{p.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
