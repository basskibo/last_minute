import SearchForm from "@/components/SearchForm";
import ProviderFilter from "@/components/ProviderFilter";
import FiltersBar from "@/components/FiltersBar";
import type { ProviderStatus } from "@/lib/search";

interface SearchPanelProps {
  destination: string;
  month?: string;
  adults: number;
  children: number;
  providerStatus: ProviderStatus[];
  resultCount: number;
}

export default function SearchPanel({
  destination,
  month,
  adults,
  children,
  providerStatus,
  resultCount,
}: SearchPanelProps) {
  return (
    <section className="surface-card overflow-hidden rounded-2xl">
      <div className="p-4 sm:p-5">
        <SearchForm
          variant="bar"
          embedded
          defaultDestination={destination}
          defaultMonth={month}
          defaultAdults={adults}
          defaultChildren={children}
        />
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
        <ProviderFilter providerStatus={providerStatus} />
      </div>

      <div className="border-t border-white/[0.06] bg-slate-900/30 px-4 py-3 sm:px-5">
        <FiltersBar resultCount={resultCount} />
      </div>
    </section>
  );
}
