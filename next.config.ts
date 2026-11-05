import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * Chromium za Booking/Airbnb na Vercelu: @sparticuz/chromium ga nosi kao
 * kompresovane binarne fajlove u `bin/` (chromium.br ~66 MB, al2023.tar.br…).
 * Next file tracing prati samo `require`-ovane JS fajlove, pa `bin/` NIJE
 * ulazio u serverless funkciju → Chromium nije mogao da se pokrene i
 * Booking/Airbnb su na produkciji uvek padali.
 *
 * Uključujemo `bin/` sa PRAVE putanje paketa (kod pnpm-a je
 * node_modules/@sparticuz/chromium samo symlink ka .pnpm/...), tako da se
 * ~70 MB spakuje tačno jednom, a ne dvaput preko symlinka.
 */
function chromiumBinGlob(): string[] {
  const linked = path.join(process.cwd(), "node_modules", "@sparticuz", "chromium");
  if (!existsSync(linked)) return [];
  const real = path.relative(process.cwd(), realpathSync(linked)).split(path.sep).join("/");
  return [`./${real}/bin/**/*`];
}

const CHROMIUM_BIN = chromiumBinGlob();

const nextConfig: NextConfig = {
  // playwright-core i @sparticuz/chromium nose native binarne fajlove —
  // ne smeju da se bundluju, moraju ostati eksterni da bi se ispravno
  // upakovali (i pronašli u runtime-u) na Vercel serverless funkciji.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/search": CHROMIUM_BIN,
    "/api/search/stream": CHROMIUM_BIN,
  },
};

export default nextConfig;
