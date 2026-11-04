import { Redis } from "@upstash/redis";
import type { SearchParams } from "./providers/types";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const TTL_SECONDS = 60 * 60 * 3;

export function buildCacheKey(params: SearchParams): string {
  // Booking/Airbnb traže konkretne datume i broj gostiju, a cena po osobi
  // zavisi od broja osoba — zato mesec i broj gostiju ulaze u ključ.
  const dest = params.destination.trim().toLowerCase();
  const period = params.checkin && params.checkout ? `${params.checkin}_${params.checkout}` : params.month ?? "any";
  return `search:v2:${dest}:${period}:${params.adults}:${params.children}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds = TTL_SECONDS): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // keš je best-effort — ne sme da obori pretragu ako Redis nije dostupan
  }
}

export const cacheEnabled = Boolean(redis);
