import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * Booking/Airbnb (headless browser) na Vercelu. Next file tracing prati samo
 * `require`-ovane JS fajlove, a ova dva paketa čitaju i fajlove sa diska:
 * - @sparticuz/chromium: `bin/` (chromium.br ~66 MB, al2023.tar.br…)
 * - playwright-core: `browsers.json` (čita ga pri učitavanju modula)
 * Bez njih funkcija na Vercelu pada ("input directory … bin does not
 * exist" / "Cannot find module … playwright-core/browsers.json").
 *
 * Fajlove uključujemo sa PRAVE putanje paketa (kod pnpm-a je
 * node_modules/<paket> samo symlink ka .pnpm/...), da se spakuju jednom.
 */
function packageGlob(name: string, pattern: string): string[] {
  const linked = path.join(process.cwd(), "node_modules", ...name.split("/"));
  if (!existsSync(linked)) return [];
  const real = path.relative(process.cwd(), realpathSync(linked)).split(path.sep).join("/");
  return [`./${real}/${pattern}`];
}

const BROWSER_FILES = [
  ...packageGlob("@sparticuz/chromium", "bin/**/*"),
  ...packageGlob("playwright-core", "**/*"),
];

const nextConfig: NextConfig = {
  // playwright-core i @sparticuz/chromium nose native binarne fajlove —
  // ne smeju da se bundluju, moraju ostati eksterni da bi se ispravno
  // upakovali (i pronašli u runtime-u) na Vercel serverless funkciji.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/search": BROWSER_FILES,
    "/api/search/stream": BROWSER_FILES,
  },
};

export default nextConfig;
