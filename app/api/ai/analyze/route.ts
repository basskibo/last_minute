import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { analyzeOffers, AI_MAX_OFFERS, type AiRequest } from "@/lib/ai/analyze";
import { GeminiError, isGeminiConfigured } from "@/lib/ai/gemini";
import { getCached, setCached } from "@/lib/cache";
import type { Offer } from "@/lib/providers/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ enabled: isGeminiConfigured() });
}

function sameOrigin(req: NextRequest): boolean {
  // Endpoint troši besplatnu Gemini kvotu — prihvatamo samo pozive sa
  // našeg sajta (browser uvek šalje Origin uz POST fetch).
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    return host === req.headers.get("x-forwarded-host") || host === req.headers.get("host");
  } catch {
    return false;
  }
}

function sanitize(body: unknown): AiRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const adults = Number(b.adults);
  const children = Number(b.children);
  if (typeof b.destination !== "string" || !b.destination.trim()) return null;
  if (!Number.isInteger(adults) || adults < 1 || adults > 20) return null;
  if (!Number.isInteger(children) || children < 0 || children > 10) return null;
  if (!Array.isArray(b.offers) || b.offers.length === 0) return null;

  const offers = (b.offers as Offer[])
    .slice(0, AI_MAX_OFFERS)
    .filter((o) => o && typeof o.id === "string" && typeof o.title === "string");

  return {
    locale: b.locale === "en" ? "en" : "sr",
    destination: b.destination.slice(0, 80),
    month: typeof b.month === "string" ? b.month.slice(0, 7) : undefined,
    adults,
    children,
    preferences: typeof b.preferences === "string" ? b.preferences.slice(0, 400) : undefined,
    offers: offers.map((o) => ({
      ...o,
      transport: Array.isArray(o.transport) ? o.transport : [],
      accommodation: Array.isArray(o.accommodation) ? o.accommodation : [],
      tags: Array.isArray(o.tags) ? o.tags : [],
    })),
  };
}

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = await req.text();
  if (raw.length > 250_000) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let parsed: AiRequest | null = null;
  try {
    parsed = sanitize(JSON.parse(raw));
  } catch {
    parsed = null;
  }
  if (!parsed) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const cacheKey = `ai:v1:${createHash("sha256")
    .update(
      JSON.stringify([
        parsed.locale,
        parsed.destination,
        parsed.month,
        parsed.adults,
        parsed.children,
        parsed.preferences ?? "",
        parsed.offers.map((o) => [o.id, o.pricePerPerson]),
      ])
    )
    .digest("hex")}`;

  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json({ analysis: cached, cached: true });

  try {
    const analysis = await analyzeOffers(parsed);
    await setCached(cacheKey, analysis, 60 * 60 * 3);
    return NextResponse.json({ analysis, cached: false });
  } catch (err) {
    if (err instanceof GeminiError) {
      const status =
        err.code === "rate_limited" ? 429 : err.code === "overloaded" ? 503 : err.code === "not_configured" ? 501 : 502;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    return NextResponse.json({ error: "failed", message: String((err as Error)?.message ?? err) }, { status: 500 });
  }
}
