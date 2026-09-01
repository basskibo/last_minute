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
