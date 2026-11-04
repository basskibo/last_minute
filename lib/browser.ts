import type { Browser, BrowserContext } from "playwright-core";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Na Vercelu koristi @sparticuz/chromium (lagan binarni Chromium prilagođen
 * serverless okruženju); lokalno koristi Chromium instaliran preko
 * `npx playwright install chromium` (dev dependency, nije u produkcijskom bundle-u).
 */
export async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");

  if (isServerless) {
    const sparticuzChromium = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      args: sparticuzChromium.args,
      executablePath: await sparticuzChromium.executablePath(),
      headless: true,
    });
  }

  return chromium.launch({ headless: true });
}

/**
 * Booking i Airbnb rade paralelno. Ranije je svaki pokretao svoj Chromium,
 * što na serverless funkciji (ograničena memorija) često obori jedan od
 * njih. Sada dele jednu instancu: svaki dobije svoj context, a browser se
 * zatvara kad ga poslednji korisnik pusti.
 */
let shared: { browser: Promise<Browser>; users: number } | null = null;

export async function acquireBrowserContext(): Promise<{
  context: BrowserContext;
  release: () => Promise<void>;
}> {
  if (!shared) {
    const browser = launchBrowser();
    shared = { browser, users: 0 };
    browser.catch(() => {
      shared = null;
    });
  }
  const entry = shared;
  entry.users++;

  let browser: Browser;
  try {
    browser = await entry.browser;
  } catch (err) {
    entry.users--;
    throw err;
  }

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
    locale: "en-US",
  });

  // Slike, fontovi i video nisu potrebni za čitanje rezultata (src atribut
  // slike ostaje u DOM-u) — preskakanje drastično ubrzava učitavanje.
  await context.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "font" || type === "media") return route.abort();
    return route.continue();
  });

  let released = false;
  return {
    context,
    release: async () => {
      if (released) return;
      released = true;
      await context.close().catch(() => {});
      entry.users--;
      if (entry.users <= 0) {
        if (shared === entry) shared = null;
        await browser.close().catch(() => {});
      }
    },
  };
}
