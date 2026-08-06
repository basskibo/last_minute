import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright-core i @sparticuz/chromium nose native binarne fajlove —
  // ne smeju da se bundluju, moraju ostati eksterni da bi se ispravno
  // upakovali (i pronašli u runtime-u) na Vercel serverless funkciji.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
};

export default nextConfig;
