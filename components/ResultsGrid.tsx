import type { Offer } from "@/lib/providers/types";
import OfferCard from "./OfferCard";
import { SearchX } from "lucide-react";

export default function ResultsGrid({ offers, people }: { offers: Offer[]; people: number }) {
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-slate-500">
        <div className="mb-3 rounded-full border border-slate-800 bg-slate-900 p-3">
          <SearchX size={22} className="text-slate-500" />
        </div>
        <p className="text-lg font-medium text-slate-300">Nema pronađenih ponuda za ovu pretragu.</p>
        <p className="mt-1 text-sm">
          Probaj drugu destinaciju ili širi period — last minute ponude se često menjaju.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {offers.map((offer, i) => (
        <div
          key={offer.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
        >
          <OfferCard offer={offer} people={people} />
        </div>
      ))}
    </div>
  );
}
