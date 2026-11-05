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

/**
 * Redosled pokušaja. "-latest" aliasi uvek pokazuju na aktuelne Flash
 * modele; Flash-Lite je rezerva kad je Flash preopterećen (503) ili kad je
 * potrošena njegova besplatna kvota (429 — kvote su po modelu).
 */
const FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "rate_limited" | "overloaded" | "bad_response" | "failed"
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

/** Modeli koji su vratili 404 — ne pokušavamo ih ponovo dok instanca živi. */
const missingModels = new Set<string>();

function modelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  return [...new Set([preferred, ...FALLBACK_MODELS].filter(Boolean) as string[])].filter(
    (m) => !missingModels.has(m)
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GenerateOptions {
  system: string;
  prompt: string;
  /** OpenAPI-subset šema za strukturisan JSON odgovor */
  schema: Record<string, unknown>;
  temperature?: number;
  /** Najduže čekanje jednog pokušaja */
  timeoutMs?: number;
  /** Ukupno vreme za sve pokušaje (svi modeli zajedno) */
  budgetMs?: number;
}

export async function generateJson<T>({
  system,
  prompt,
  schema,
  temperature = 0.3,
  timeoutMs = 20000,
  budgetMs = 45000,
}: GenerateOptions): Promise<T> {
  const key = geminiApiKey();
  if (!key) throw new GeminiError("GEMINI_API_KEY nije podešen.", "not_configured");

  const models = modelCandidates();
  // Ukupni budžet za sve pokušaje (ruta ima maxDuration 60 s).
  const deadline = Date.now() + budgetMs;

  let lastError: unknown = null;
  let sawRateLimit = false;
  let sawOverload = false;

  for (const [i, model] of models.entries()) {
    const remaining = deadline - Date.now();
    if (remaining < 1500) break;
    if (i > 0 && (sawOverload || sawRateLimit)) await sleep(500);

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
      signal: AbortSignal.timeout(Math.min(timeoutMs, remaining)),
      cache: "no-store",
    }).catch((err: unknown) => {
      lastError = err;
      return null;
    });

    if (!res) continue; // timeout / mreža → sledeći model

    if (res.status === 404) {
      missingModels.add(model);
      lastError = new Error(`Model ${model} nije dostupan`);
      continue;
    }
    if (res.status === 429) {
      sawRateLimit = true;
      lastError = new Error(`${model}: 429`);
      continue;
    }
    if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
      sawOverload = true;
      lastError = new Error(`${model}: HTTP ${res.status}`);
      continue;
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
      return JSON.parse(text) as T;
    } catch {
      lastError = new Error(`${model}: neispravan JSON`);
      continue;
    }
  }

  if (sawOverload) {
    throw new GeminiError("Gemini modeli su trenutno preopterećeni — probaj ponovo za koji minut.", "overloaded");
  }
  if (sawRateLimit) {
    throw new GeminiError("Dostignut je limit besplatnog Gemini plana — probaj za minut.", "rate_limited");
  }
  throw new GeminiError(
    `Nijedan Gemini model nije dostupan (${models.join(", ")}): ${String(
      (lastError as Error)?.message ?? lastError
    )}`,
    "failed"
  );
}
