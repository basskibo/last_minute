import { NextRequest } from "next/server";
import type { SearchParams } from "@/lib/providers/types";
import { performSearchStreaming, type SearchProgressEvent } from "@/lib/search";
import { isValidRange } from "@/lib/dates";
import type { SortOption } from "@/lib/normalize";

export const runtime = "nodejs";
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

function sseLine(data: SearchProgressEvent | { error: string }): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const parsed = parseParams(req.nextUrl.searchParams);
  if ("error" in parsed) {
    return new Response(sseLine({ error: parsed.error }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SearchProgressEvent | { error: string }) => {
        try {
          controller.enqueue(encoder.encode(sseLine(event)));
        } catch {
          // klijent je već zatvorio vezu
        }
      };

      // Heartbeat: SSE komentar na svakih 8 s, da proksiji (CDN, Vercel)
      // ne prekinu vezu dok sporiji izvori (Booking) još rade.
      let closed = false;
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
        }
      }, 8000);

      try {
        await performSearchStreaming(
          parsed.params,
          parsed.sort,
          parsed.providerFilter,
          (event) => send(event),
          { skipBrowser: req.nextUrl.searchParams.get("nobrowser") === "1" }
        );
      } catch (err) {
        send({ error: String((err as Error)?.message ?? err) });
      } finally {
        closed = true;
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
