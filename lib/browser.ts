import type { Browser } from "playwright-core";

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
