import { LMP_COUNTRIES } from "../providers/lmp-countries";
import {
  countryEnglishName,
  resolveDestinationLocal,
  type ResolvedDestination,
} from "../destinations";
import { getCached, setCached } from "../cache";
import { generateJson, isGeminiConfigured } from "./gemini";

const COUNTRY_NAMES = [...Object.keys(LMP_COUNTRIES), "Albanija"];

/**
 * Lokalni rečnik pokriva najčešća mesta; za ostala ("Kapadokija",
 * "Lago di Garda"…) pitamo Gemini kojoj državi pripadaju. Rezultat se
 * kešira 30 dana. Bez ključa ili na grešku vraća lokalni rezultat.
 */
export async function resolveDestination(query: string): Promise<ResolvedDestination> {
  const local = resolveDestinationLocal(query);
  if (local.country || !isGeminiConfigured()) return local;

  const cacheKey = `dest:v1:${query.trim().toLowerCase()}`;
  const cached = await getCached<{ country: string | null; en: string }>(cacheKey);

  let answer = cached;
  if (!answer) {
    try {
      answer = await generateJson<{ country: string | null; en: string }>({
        system:
          "You map travel destinations to countries. Answer only with JSON. " +
          "`country` must be EXACTLY one of the provided Serbian country names, or null if the place is unknown or not in the list. " +
          "`en` is the common English name of the place as you would type it into Booking.com.",
        prompt: `Destination typed by a Serbian user: "${query.slice(0, 80)}"\nAllowed country names: ${COUNTRY_NAMES.join(", ")}`,
        schema: {
          type: "OBJECT",
          properties: {
            country: { type: "STRING", nullable: true },
            en: { type: "STRING" },
          },
          required: ["country", "en"],
        },
        temperature: 0,
        timeoutMs: 5000,
        budgetMs: 7000,
      });
      if (answer.country && !COUNTRY_NAMES.includes(answer.country)) answer.country = null;
      await setCached(cacheKey, answer, 60 * 60 * 24 * 30);
    } catch {
      return local;
    }
  }

  if (!answer?.country) return { ...local, bookingQuery: answer?.en || local.bookingQuery };
  const countryEn = countryEnglishName(answer.country);
  return {
    query,
    country: answer.country,
    place: { name: query.trim(), en: answer.en || query.trim(), country: answer.country, kind: "place" },
    bookingQuery: answer.en ? `${answer.en}${countryEn ? `, ${countryEn}` : ""}` : query,
  };
}
