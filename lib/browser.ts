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
      // Bez --single-process: Booking, Airbnb i Filip Travel rade u istom
      // browseru (vidi acquireBrowserContext). U single-process režimu
      // zatvaranje jednog taba/contexta ruši ceo Chromium, pa su ostali
      // izvori padali sa "Target page, context or browser has been closed"
      // (reprodukovano lokalno sa istim @sparticuz/chromium binarnim fajlom).
      args: sparticuzChromium.args.filter((arg) => arg !== "--single-process"),
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
    const entry = { browser, users: 0 };
    shared = entry;
    browser.then(
      (b) =>
        b.on("disconnected", () => {
          // Srušen ili zatvoren browser — sledeća pretraga pokreće novi.
          if (shared === entry) shared = null;
        }),
      () => {
        if (shared === entry) shared = null;
      }
    );
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

/**
 * Kad sajt ne vrati nijednu karticu, opiše šta je zapravo učitano — da se
 * u UI-ju i Vercel logovima vidi razlog (anti-bot provera, prazna strana,
 * promenjen HTML) umesto tihog "0 rezultata".
 */
export async function describeEmptyPage(page: import("playwright-core").Page): Promise<string> {
  try {
    const title = (await page.title()).slice(0, 80);
    const url = new URL(page.url());
    const cookies = await page.context().cookies().catch(() => []);
    const wafToken = cookies.some((c) => c.name === "aws-waf-token");
    // Činjenice sa strane — bez nagađanja (skripte za WAF postoje i na
    // normalnim stranama, pa same po sebi ne znače blokadu).
    const info = await page
      .evaluate(() => {
        const h1 = document.querySelector("h1")?.textContent?.trim().slice(0, 100) ?? "";
        const captcha = Boolean(
          document.querySelector(
            '#captcha-container, awswaf-captcha, iframe[src*="captcha"], iframe[src*="challenge"], .g-recaptcha, #challenge-form'
          )
        );
        const ids = new Map<string, number>();
        document.querySelectorAll("[data-testid]").forEach((el) => {
          const id = el.getAttribute("data-testid") ?? "";
          ids.set(id, (ids.get(id) ?? 0) + 1);
        });
        const top = [...ids.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([id, n]) => `${id}×${n}`)
          .join(", ");
        return { h1, captcha, top, textLen: document.body?.innerText?.length ?? 0 };
      })
      .catch(() => ({ h1: "", captcha: false, top: "", textLen: 0 }));

    const facts = `naslov: "${title}"; h1: "${info.h1}"; ${url.host}${url.pathname}; tekst: ${info.textLen} znakova; aws-waf-token: ${wafToken ? "da" : "ne"}; data-testid: ${info.top || "nema"}`;
    return info.captcha
      ? `sajt je prikazao captcha proveru — server IP je verovatno blokiran (${facts})`
      : `nijedna kartica nije učitana (${facts})`;
  } catch (err) {
    return `strana nije učitana (${String((err as Error)?.message ?? err).slice(0, 120)})`;
  }
}
