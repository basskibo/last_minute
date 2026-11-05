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

/**
 * Lista Flash modela dostupnih ZA OVAJ KLJUČ (Google ListModels), da ne
 * nagađamo nazive koji se menjaju. Keš po instanci, 6 h.
 * Redosled: stabilni (ne-preview) od najnovije verzije, Flash pre Flash-Lite;
 * preview modeli na kraju.
 */
let listedCache: { at: number; models: string[] } | null = null;

async function listFlashModels(key: string): Promise<string[]> {
  if (listedCache && Date.now() - listedCache.at < 6 * 3600_000) return listedCache.models;
  try {
    const res = await fetch(`${API_BASE}?pageSize=200`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };
    const version = (m: string) => parseFloat(m.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? "0");
    const models = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter((m) => /^gemini-[\d.]+-flash/.test(m))
      .filter((m) => !/image|tts|audio|live|embedding|exp|thinking|computer|robotics/.test(m))
      .sort((a, b) => {
        const preview = Number(a.includes("preview")) - Number(b.includes("preview"));
        if (preview) return preview;
        const v = version(b) - version(a);
        if (v) return v;
        return Number(a.includes("lite")) - Number(b.includes("lite"));
      });
    listedCache = { at: Date.now(), models };
    return models;
  } catch {
    return [];
  }
}

async function modelCandidates(key: string): Promise<string[]> {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const listed = (await listFlashModels(key)).filter((m) => !m.includes("preview"));
  const lite = listed.filter((m) => m.includes("lite"));
  const flash = listed.filter((m) => !m.includes("lite"));
  // Najnoviji Flash modeli su na besplatnom planu često preopterećeni (503
  // "high demand"), pa redom probamo raznovrsne modele umesto da trošimo
  // vreme na ponavljanje istog: Flash-Lite (najdostupniji), Flash, pa
  // stariji stabilni modeli i aliasi.
  return [
    ...new Set(
      [
        preferred,
        lite[0],
        flash[0],
        lite[1],
        "gemini-2.5-flash-lite",
        flash[1],
        "gemini-2.5-flash",
        ...FALLBACK_MODELS,
      ].filter(Boolean) as string[]
    ),
  ]
    .filter((m) => !missingModels.has(m))
    .slice(0, 7);
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
  timeoutMs = 14000,
  budgetMs = 48000,
}: GenerateOptions): Promise<T> {
  const key = geminiApiKey();
  if (!key) throw new GeminiError("GEMINI_API_KEY nije podešen.", "not_configured");

  const models = await modelCandidates(key);
  const attempts: string[] = [];
  // Ukupni budžet za sve pokušaje (ruta ima maxDuration 60 s).
  const deadline = Date.now() + budgetMs;

  let lastError: unknown = null;
  let sawRateLimit = false;
  let sawOverload = false;

  for (const [i, model] of models.entries()) {
    const remaining = deadline - Date.now();
    if (remaining < 1500) break;
    if (i > 0 && (sawOverload || sawRateLimit)) await sleep(300);

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

    if (!res) {
      attempts.push(`${model}: timeout/mreža`);
      continue; // → sledeći model
    }
    if (!res.ok) attempts.push(`${model}: ${res.status}`);

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
      attempts.push(`${model}: neispravan JSON`);
      lastError = new Error(`${model}: neispravan JSON`);
      continue;
    }
  }

  if (sawOverload) {
    throw new GeminiError(
      `Gemini modeli su trenutno preopterećeni — probaj ponovo za koji minut. [${attempts.join(", ")}]`,
      "overloaded"
    );
  }
  if (sawRateLimit) {
    throw new GeminiError(
      `Dostignut je limit besplatnog Gemini plana — probaj za minut. [${attempts.join(", ")}]`,
      "rate_limited"
    );
  }
  throw new GeminiError(
    `Nijedan Gemini model nije uspeo [${attempts.join(", ")}]: ${String(
      (lastError as Error)?.message ?? lastError
    )}`,
    "failed"
  );
}
