import * as cheerio from "cheerio";

export function parsePriceEur(text: string | undefined | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(/,(?=\d{3})/g, "");
  const match = cleaned.match(/(\d+(?:,\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

export function normalizeDestinationKey(destination: string): string {
  return destination
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prva smislena slika sa stranice (ignoriše ikonice, pixel trackere, zastave). */
export function firstImageSrc(
  html: string,
  baseUrl: string,
  pattern: RegExp
): string | undefined {
  const $ = cheerio.load(html);
  let found: string | undefined;
  $("img[src]").each((_, el) => {
    if (found) return;
    const src = $(el).attr("src");
    if (!src || !pattern.test(src)) return;
    if (/pixel|facebook|favicon|flag_|icon-|1x1/i.test(src)) return;
    found = new URL(src, baseUrl).toString();
  });
  return found;
}

export async function fetchHtml(url: string, timeoutMs = 9000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "sr-RS,sr;q=0.9,en;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} HTTP ${res.status}`);
  return res.text();
}
