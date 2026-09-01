"use client";

import type { Offer } from "@/lib/providers/types";
import OfferCard from "./OfferCard";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { SearchX } from "lucide-react";

export default function ResultsGrid({ offers, people }: { offers: Offer[]; people: number }) {
  const { t } = useAppPreferences();

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-theme-subtle">
        <div className="mb-3 rounded-full border border-[var(--border)] surface-card p-3">
          <SearchX size={22} className="text-theme-subtle" />
        </div>
        <p className="text-lg font-medium text-theme-muted">{t("results.emptyTitle")}</p>
        <p className="mt-1 text-sm">{t("results.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer, i) => (
        <div
          key={offer.id}
          className="animate-fade-up h-full"
          style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
        >
          <OfferCard offer={offer} people={people} />
        </div>
      ))}
    </div>
  );
}
