/**
 * Minimalni klijent za Google Gemini API (REST, bez SDK-a).
 *
 * Env:
 * - GEMINI_API_KEY (obavezno) — ključ iz Google AI Studio (besplatan tier).
 * - GEMINI_MODEL (opciono) — npr. "gemini-2.5-flash". Ako model nije
 *   dostupan (404), klijent prelazi na sledeći iz FALLBACK_MODELS, pa
 *   aplikacija nastavlja da radi i kad Google povuče stariji model.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Alias "-latest" uvek pokazuje na aktuelni Flash model. */
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"];

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "rate_limited" | "bad_response" | "failed"
  ) {
    super(message);
  }
}

export function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(geminiApiKey());
}

function modelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  return [...new Set([preferred, ...FALLBACK_MODELS].filter(Boolean) as string[])];
}

/** Model koji je poslednji uspešno odgovorio — da se ne proba 404 svaki put. */
let workingModel: string | null = null;

interface GenerateOptions {
  system: string;
  prompt: string;
  /** OpenAPI-subset šema za strukturisan JSON odgovor */
  schema: Record<string, unknown>;
  temperature?: number;
  timeoutMs?: number;
}

export async function generateJson<T>({
  system,
  prompt,
  schema,
  temperature = 0.3,
  timeoutMs = 25000,
}: GenerateOptions): Promise<T> {
  const key = geminiApiKey();
  if (!key) throw new GeminiError("GEMINI_API_KEY nije podešen.", "not_configured");

  const models = workingModel
    ? [workingModel, ...modelCandidates().filter((m) => m !== workingModel)]
    : modelCandidates();

  let lastError: unknown = null;

  for (const model of models) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    }).catch((err: unknown) => {
      lastError = err;
      return null;
    });

    if (!res) continue;

    if (res.status === 404) {
      lastError = new Error(`Model ${model} nije dostupan`);
      continue;
    }
    if (res.status === 429) {
      throw new GeminiError("Dostignut je limit besplatnog Gemini plana — probaj za minut.", "rate_limited");
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new GeminiError(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`, "failed");
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    try {
      const parsed = JSON.parse(text) as T;
      workingModel = model;
      return parsed;
    } catch {
      throw new GeminiError("Gemini je vratio neispravan JSON.", "bad_response");
    }
  }

  throw new GeminiError(
    `Nijedan Gemini model nije dostupan (${models.join(", ")}): ${String(
      (lastError as Error)?.message ?? lastError
    )}`,
    "failed"
  );
}
