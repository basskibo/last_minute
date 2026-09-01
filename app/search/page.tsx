import SearchEmptyPrompt from "@/components/SearchEmptyPrompt";
import SearchPageClient from "@/components/SearchPageClient";
import type { SortOption } from "@/lib/normalize";

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
  const sort = (sp.sort as SortOption) || "price-asc";
  const month = sp.month && sp.month !== "any" ? sp.month : undefined;
  const providerFilter = sp.providers ? sp.providers.split(",") : undefined;

  if (!destination) {
    return <SearchEmptyPrompt adults={adults} children={children} />;
  }

  return (
    <SearchPageClient
      destination={destination}
      month={month}
      adults={adults}
      children={children}
      sort={sort}
      providerFilter={providerFilter}
    />
  );
}
