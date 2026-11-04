import { NextRequest, NextResponse } from "next/server";
import type { SearchParams } from "@/lib/providers/types";
import { performSearch } from "@/lib/search";
import type { SortOption } from "@/lib/normalize";
import { isValidRange } from "@/lib/dates";

export const runtime = "nodejs";
// Booking/Airbnb koriste headless browser (Playwright) koji je sporiji od
// običnog fetch-a — produžen limit da stigne da završi na Vercelu.
export const maxDuration = 60;

function parseParams(
  searchParams: URLSearchParams
):
  | { params: SearchParams; sort: SortOption; providerFilter?: string[] }
  | { error: string } {
  const destination = searchParams.get("destination")?.trim();
  if (!destination) return { error: "Nedostaje destinacija." };

  const adultsRaw = searchParams.get("adults");
  const childrenRaw = searchParams.get("children");
  const adults = adultsRaw ? parseInt(adultsRaw, 10) : 2;
  const children = childrenRaw ? parseInt(childrenRaw, 10) : 0;

  if (!Number.isFinite(adults) || adults < 1 || adults > 20) {
    return { error: "Broj odraslih mora biti između 1 i 20." };
  }
  if (!Number.isFinite(children) || children < 0 || children > 10) {
    return { error: "Broj dece mora biti između 0 i 10." };
  }

  const monthRaw = searchParams.get("month");
  const month = monthRaw && monthRaw !== "any" ? monthRaw : undefined;
  const sort = (searchParams.get("sort") as SortOption) || "price-asc";

  const providersRaw = searchParams.get("providers");
  const providerFilter = providersRaw ? providersRaw.split(",") : undefined;

  const fromRaw = searchParams.get("from") ?? undefined;
  const toRaw = searchParams.get("to") ?? undefined;
  const exact = isValidRange(fromRaw, toRaw);

  return {
    params: {
      destination,
      adults,
      children,
      month: exact ? undefined : month,
      checkin: exact ? fromRaw : undefined,
      checkout: exact ? toRaw : undefined,
    },
    sort,
    providerFilter,
  };
}

export async function GET(req: NextRequest) {
  const parsed = parseParams(req.nextUrl.searchParams);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await performSearch(parsed.params, parsed.sort, parsed.providerFilter);
  return NextResponse.json(result);
}
