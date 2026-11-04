"use client";

import type { Offer } from "@/lib/providers/types";
import type { AiPick } from "@/lib/ai/analyze";
import OfferCard from "./OfferCard";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { SearchX } from "lucide-react";

export default function ResultsGrid({
  offers,
  people,
  aiPicks,
  filteredOut = false,
  onResetFilters,
}: {
  offers: Offer[];
  people: number;
  aiPicks?: Map<string, AiPick>;
  /** true = ima rezultata, ali ih filteri sve skrivaju */
  filteredOut?: boolean;
  onResetFilters?: () => void;
}) {
  const { t } = useAppPreferences();

  if (offers.length === 0) {
    return (
      <div className="lm-panel flex flex-col items-center px-6 py-16 text-center text-ink-subtle">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-2">
          <SearchX size={22} className="text-ink-muted" aria-hidden />
        </div>
        <p className="font-display text-xl font-bold text-ink">
          {filteredOut ? t("filters.noMatch") : t("results.emptyTitle")}
        </p>
        {filteredOut ? (
          onResetFilters && (
            <button type="button" onClick={onResetFilters} className="lm-btn lm-btn--secondary lm-btn--sm mt-4">
              {t("filters.reset")}
            </button>
          )
        ) : (
          <p className="mt-1 text-sm">{t("results.emptyHint")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {offers.map((offer, i) => (
        <div
          key={offer.id}
          data-offer-id={offer.id}
          className="animate-fade-up h-full overflow-visible"
          style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
        >
          <OfferCard offer={offer} people={people} aiPick={aiPicks?.get(offer.id)} />
        </div>
      ))}
    </div>
  );
}
