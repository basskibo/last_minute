import SearchForm from "@/components/SearchForm";
import ResultsGrid from "@/components/ResultsGrid";
import FiltersBar from "@/components/FiltersBar";
import ProviderFilter from "@/components/ProviderFilter";
import { performSearch } from "@/lib/search";
import type { SortOption } from "@/lib/normalize";
import { Callout, Flex } from "@radix-ui/themes";
import { AlertTriangle, Info } from "lucide-react";

// Booking/Airbnb koriste headless browser (Playwright) koji je sporiji od
// običnog fetch-a — produžen limit da stigne da završi na Vercelu.
export const maxDuration = 60;

interface SearchPageProps {
  searchParams: Promise<{
    destination?: string;
    month?: string;
    adults?: string;
    children?: string;
    sort?: string;
    providers?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const destination = sp.destination?.trim() ?? "";
  const adults = sp.adults ? parseInt(sp.adults, 10) || 2 : 2;
  const children = sp.children ? parseInt(sp.children, 10) || 0 : 0;
  const people = adults + children;
  const sort = (sp.sort as SortOption) || "price-asc";
  const month = sp.month && sp.month !== "any" ? sp.month : undefined;
  const providerFilter = sp.providers ? sp.providers.split(",") : undefined;

  if (!destination) {
    return (
      <Flex direction="column" align="center" className="flex-1 px-4 py-16" gap="8">
        <p className="text-slate-400">Unesi destinaciju da bi video ponude.</p>
        <SearchForm defaultAdults={adults} defaultChildren={children} />
      </Flex>
    );
  }

  const { offers, errors, providerStatus } = await performSearch(
    { destination, month, adults, children },
    sort,
    providerFilter
  );

  return (
    <div className="flex flex-col flex-1 px-4 sm:px-6 py-8 gap-6 max-w-6xl mx-auto w-full">
      <SearchForm
        defaultDestination={destination}
        defaultMonth={month}
        defaultAdults={adults}
        defaultChildren={children}
      />

      {errors.length > 0 && (
        <Callout.Root color="amber" variant="soft">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>
            Neki izvori trenutno nisu dostupni ({errors.map((e) => e.provider).join(", ")}) —
            prikazani su rezultati iz ostalih izvora.
          </Callout.Text>
        </Callout.Root>
      )}

      {month && (
        <Callout.Root color="gray" variant="soft">
          <Callout.Icon>
            <Info size={16} />
          </Callout.Icon>
          <Callout.Text>
            Izabrani mesec služi kao orijentir — ponude koje ga pominju su na vrhu, ali
            prikazujemo i ostale jer se last minute termini stalno menjaju.
          </Callout.Text>
        </Callout.Root>
      )}

      <ProviderFilter providerStatus={providerStatus} />

      <div>
        <FiltersBar resultCount={offers.length} />
        <ResultsGrid offers={offers} people={people} />
      </div>
    </div>
  );
}
