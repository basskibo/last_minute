import SearchEmptyPrompt from "@/components/SearchEmptyPrompt";
import SearchPageClient from "@/components/SearchPageClient";
import { isValidRange } from "@/lib/dates";

export const maxDuration = 60;

interface SearchPageProps {
  searchParams: Promise<{
    destination?: string;
    month?: string;
    from?: string;
    to?: string;
    adults?: string;
    children?: string;
  }>;
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const destination = sp.destination?.trim() ?? "";
  const adults = clampInt(sp.adults, 2, 1, 20);
  const childCount = clampInt(sp.children, 0, 0, 10);
  const exact = isValidRange(sp.from, sp.to);
  const month = !exact && sp.month && sp.month !== "any" ? sp.month : undefined;

  if (!destination) {
    return <SearchEmptyPrompt adults={adults} childrenCount={childCount} />;
  }

  return (
    <SearchPageClient
      key={`${destination}|${month}|${sp.from}|${sp.to}|${adults}|${childCount}`}
      destination={destination}
      month={month}
      from={exact ? sp.from : undefined}
      to={exact ? sp.to : undefined}
      adults={adults}
      childrenCount={childCount}
    />
  );
}
