import type { Offer } from "@/lib/providers/types";
import OfferCard from "./OfferCard";
import { SearchX } from "lucide-react";

export default function ResultsGrid({ offers, people }: { offers: Offer[]; people: number }) {
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 text-slate-500">
        <div className="rounded-full bg-slate-900 border border-slate-800 p-3 mb-3">
          <SearchX size={22} className="text-slate-500" />
        </div>
        <p className="text-lg font-medium text-slate-300">Nema pronađenih ponuda za ovu pretragu.</p>
        <p className="text-sm mt-1">
          Probaj drugu destinaciju ili širi period — last minute ponude se često menjaju.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} people={people} />
      ))}
    </div>
  );
}
