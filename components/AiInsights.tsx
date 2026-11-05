"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Lightbulb, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { Offer } from "@/lib/providers/types";
import type { AiAnalysis } from "@/lib/ai/analyze";

const AI_MAX_OFFERS = 40;

let enabledPromise: Promise<boolean> | null = null;
function checkEnabled(): Promise<boolean> {
  enabledPromise ??= fetch("/api/ai/analyze")
    .then((r) => r.json())
    .then((d: { enabled?: boolean }) => Boolean(d.enabled))
    .catch(() => false);
  return enabledPromise;
}

type Status = "checking" | "disabled" | "idle" | "loading" | "done" | "error";

export interface AiContext {
  destination: string;
  month?: string;
  adults: number;
  children: number;
}

export default function AiInsights({
  offers,
  context,
  onAnalysis,
}: {
  /** Ponude posle filtera, u trenutnom redosledu */
  offers: Offer[];
  context: AiContext;
  onAnalysis: (analysis: AiAnalysis | null) => void;
}) {
  const { locale, t } = useAppPreferences();
  const [status, setStatus] = useState<Status>("checking");
  const [errorKind, setErrorKind] = useState<"rate" | "busy" | "config" | "other">("other");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  /** true = Gemini nije odgovorio, prikazan je automatski (pravilima) izbor */
  const [fallback, setFallback] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzed, setAnalyzed] = useState<Offer[]>([]);
  const [prefs, setPrefs] = useState("");
  const autoRan = useRef<string | null>(null);

  const run = useCallback(
    async (preferences: string) => {
      const batch = offers.slice(0, AI_MAX_OFFERS);
      if (batch.length === 0) return;
      setStatus("loading");
      try {
        // Mrežni prekid (npr. net::ERR_NETWORK_CHANGED) → još jedan pokušaj.
        const body = JSON.stringify({ ...context, locale, preferences, offers: batch });
        const post = () =>
          fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body });
        const res = await post().catch(async () => {
          await new Promise((r) => setTimeout(r, 1500));
          return post();
        });
        const data = (await res.json()) as {
          analysis?: AiAnalysis;
          fallback?: boolean;
          error?: string;
          message?: string;
        };
        setFallback(Boolean(data.fallback));
        setErrorDetail(data.fallback ? (data.message?.match(/\[(.*)\]/)?.[1] ?? data.message ?? null) : null);
        if (!res.ok || !data.analysis) {
          setErrorDetail(data.message?.match(/\[(.*)\]/)?.[1] ?? data.message ?? null);
          setErrorKind(
            data.error === "rate_limited"
              ? "rate"
              : data.error === "overloaded"
                ? "busy"
                : data.error === "not_configured"
                  ? "config"
                  : "other"
          );
          setStatus("error");
          return;
        }
        setAnalysis(data.analysis);
        setAnalyzed(batch);
        onAnalysis(data.analysis);
        setStatus("done");
      } catch {
        setErrorKind("other");
        setStatus("error");
      }
    },
    [offers, context, locale, onAnalysis]
  );

  // Automatski jednom po pretrazi (destinacija + period + gosti + jezik).
  const searchKey = `${context.destination}|${context.month}|${context.adults}|${context.children}|${locale}`;
  useEffect(() => {
    let cancelled = false;
    checkEnabled().then((enabled) => {
      if (cancelled) return;
      if (!enabled) {
        setStatus("disabled");
        return;
      }
      if (autoRan.current !== searchKey && offers.length > 0) {
        autoRan.current = searchKey;
        void run("");
      } else {
        setStatus((s) => (s === "checking" ? "idle" : s));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchKey, offers.length, run]);

  if (status === "checking") return null;

  if (status === "disabled") {
    return (
      <section className="lm-ai lm-ai--muted" aria-label={t("ai.title")}>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Sparkles size={16} className="text-ink-subtle" aria-hidden />
          {t("ai.notConfigured")}
        </p>
      </section>
    );
  }

  const byId = new Map(analyzed.map((o) => [o.id, o]));

  function scrollToOffer(id: string) {
    const el = document.querySelector(`[data-offer-id="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el?.querySelector("a") as HTMLElement | null)?.focus({ preventScroll: true });
  }

  return (
    <section className="lm-ai" aria-label={t("ai.title")} aria-busy={status === "loading"}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink">
            <span className="lm-ai__icon" aria-hidden>
              <Sparkles size={16} />
            </span>
            {t("ai.title")}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{t("ai.subtitle")}</p>
        </div>
      </header>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void run(prefs);
        }}
      >
        <label htmlFor="ai-prefs" className="sr-only">
          {t("ai.prefsLabel")}
        </label>
        <input
          id="ai-prefs"
          value={prefs}
          onChange={(e) => setPrefs(e.target.value)}
          maxLength={400}
          placeholder={`${t("ai.prefsLabel")} ${t("ai.prefsPlaceholder")}`}
          className="lm-input flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading" || offers.length === 0}
          className="lm-btn lm-btn--primary lm-btn--sm shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : analysis ? (
            <RefreshCw size={15} aria-hidden />
          ) : (
            <Sparkles size={15} aria-hidden />
          )}
          {analysis ? t("ai.rerun") : t("ai.run")}
        </button>
      </form>

      {offers.length === 0 && <p className="text-sm text-ink-subtle">{t("ai.empty")}</p>}

      {status === "loading" && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 size={15} className="animate-spin text-primary" aria-hidden />
            {t("ai.loading", { count: Math.min(offers.length, AI_MAX_OFFERS) })}
          </p>
          <div className="skeleton-shimmer h-3.5 w-[92%] rounded" />
          <div className="skeleton-shimmer h-3.5 w-[78%] rounded" />
          <div className="skeleton-shimmer h-3.5 w-[64%] rounded" />
        </div>
      )}

      {status === "error" && (
        <div className="lm-callout lm-callout--warning" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <div className="min-w-0">
          {errorKind === "rate"
            ? t("ai.rateLimited")
            : errorKind === "busy"
              ? t("ai.busy")
              : errorKind === "config"
                ? t("ai.notConfigured")
                : t("ai.error")}
            {errorDetail && (
              <details className="mt-1 text-xs">
                <summary className="cursor-pointer font-semibold">{t("search.errorDetails")}</summary>
                <p className="mt-1 break-words">{errorDetail}</p>
              </details>
            )}
          </div>
        </div>
      )}

      {analysis && status !== "loading" && (
        <div className="flex flex-col gap-5">
          {fallback && (
            <div className="lm-callout lm-callout--info">
              <Lightbulb size={16} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p>{t("ai.fallbackNote")}</p>
                {errorDetail && (
                  <details className="mt-1 text-xs">
                    <summary className="cursor-pointer font-semibold">{t("search.errorDetails")}</summary>
                    <p className="mt-1 break-words">{errorDetail}</p>
                  </details>
                )}
              </div>
            </div>
          )}
          {analysis.summary && <p className="text-[15px] leading-6 text-ink">{analysis.summary}</p>}

          {analysis.picks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="lm-label">{t("ai.picks")}</h3>
              <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {analysis.picks.map((p) => {
                  const offer = byId.get(p.id);
                  if (!offer) return null;
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => scrollToOffer(p.id)} className="lm-ai__pick">
                        <span className="lm-ai__rank">{p.rank}</span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="line-clamp-1 text-sm font-semibold text-ink">{offer.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                            {offer.pricePerPerson != null && (
                              <span className="tabular">{Math.round(offer.pricePerPerson)} € / os.</span>
                            )}
                            <span className="text-primary">{t("ai.match", { score: p.score })}</span>
                            <span className="truncate">{offer.sourceLabel}</span>
                          </span>
                          <span className="mt-1 line-clamp-3 text-xs leading-5 text-ink-muted">{p.reason}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {(analysis.insights.length > 0 || analysis.cautions.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.insights.length > 0 && (
                <div>
                  <h3 className="lm-label mb-2">{t("ai.insights")}</h3>
                  <ul className="flex flex-col gap-1.5">
                    {analysis.insights.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-5 text-ink-muted">
                        <Lightbulb size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.cautions.length > 0 && (
                <div>
                  <h3 className="lm-label mb-2">{t("ai.cautions")}</h3>
                  <ul className="flex flex-col gap-1.5">
                    {analysis.cautions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-5 text-ink-muted">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-ink-subtle">
            {t("ai.basedOn", { count: analyzed.length })} {t("ai.disclaimer")}
          </p>
        </div>
      )}
    </section>
  );
}
