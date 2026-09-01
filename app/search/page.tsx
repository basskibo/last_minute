import SearchForm from "@/components/SearchForm";
import SearchPageClient from "@/components/SearchPageClient";
import type { SortOption } from "@/lib/normalize";
import { Flex } from "@radix-ui/themes";

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
    return (
      <Flex direction="column" align="center" className="flex-1 px-4 py-16" gap="8">
        <p className="text-theme-muted">Unesi destinaciju da bi video ponude.</p>
        <SearchForm defaultAdults={adults} defaultChildren={children} showQuickPicks />
      </Flex>
    );
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
