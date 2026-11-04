# Poslednji Trenutak

A last-minute accommodation and package-deal aggregator. The user enters a
destination, a flexible period (month), and the number of people
(adults/children) — the app collects available offers from multiple sources
and shows them in one place, sorted by price or discount.

## How it works

- **No database.** Results are fetched live by scraping sources on every
  search, with optional short-lived caching (a few hours) via Upstash Redis
  so sources aren't hammered and responses stay fast.
- **Sources (`lib/providers/`):**
  - `lastminuteponude.ts` — plain HTML scraping (cheerio/fetch) of
    [lastminuteponude.com](https://www.lastminuteponude.com), which itself
    aggregates dozens of Serbian agencies (Oktopod, Sole Azur, Viva Travel,
    Astra Travel, Hedonic Travel, and others).
  - `oktopod.ts` — HTML scrape of a price table by property/date/room type,
    currently mapped only for Greece (the only confirmed page with a
    structured table — other Oktopod campaigns are PDFs/announcements
    without parsable data).
  - `booking.ts`, `airbnb.ts` — **headless browser (Playwright)**. Both
    sites block plain HTTP requests (Booking immediately returns an AWS WAF
    JS challenge; Airbnb renders everything client-side), so a real
    Chromium instance is used (`lib/browser.ts`) that executes JS and reads
    results from the DOM. Slower than a plain fetch (a few seconds per
    search) and more sensitive to changes in the source's DOM structure.
- Each source has its own timeout and fails independently
  (`Promise.allSettled` in `lib/search.ts`) — if one source goes down, the
  others keep working. Results without a detailed room breakdown
  (Booking/Airbnb/lastminuteponude) show a "total" approximation (price ×
  number of people); Oktopod has an actual room-type table, so it picks the
  room whose capacity best matches the requested number of people
  (`lib/rooms.ts`).

## Running locally

```bash
npm install
npx playwright install chromium
npm run dev
```

Open `http://localhost:3000`. `playwright install chromium` is a one-time
step that downloads a local browser for the Booking/Airbnb providers (it
doesn't ship in the production build — Vercel uses `@sparticuz/chromium`,
see below).

## Environment variables

Copy `.env.example` to `.env.local` if you want caching:

```bash
cp .env.example .env.local
```

- `GEMINI_API_KEY` — enables the AI analysis on the results page (best
  matches, insights, cautions) and resolves unknown places to a country
  (e.g. "Kapadokija" → Turska). Get a free key at
  https://aistudio.google.com/apikey. On Vercel: Project → Settings →
  Environment Variables → add `GEMINI_API_KEY`, then redeploy. Without it
  the app works normally and the AI panel says it's off.
- `GEMINI_MODEL` (optional) — pin a model (e.g. `gemini-2.5-flash`). By
  default the app uses `gemini-flash-latest` and falls back to other Flash
  models if one is unavailable.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — Upstash Redis REST credentials.
  On Vercel: Project → Storage → add a Redis (Marketplace) integration, and
  it sets these automatically. Without them the app works normally, just
  without caching.

## Deploying to Vercel

```bash
npx vercel
```

or connect the repo directly in the Vercel dashboard. After the first
deploy, optionally add a Redis integration for caching (Storage tab in the
project).

**Note for Booking/Airbnb (Playwright):**
- `@sparticuz/chromium` and `playwright-core` are configured as
  `serverExternalPackages` in `next.config.ts` so their native binary files
  don't get mangled by bundling.
- `/api/search` and `/search` have `maxDuration = 60` (Vercel Hobby allows
  up to 60s, Pro up to 300s) because headless search can take a while.
- The serverless function realistically needs at least 1024MB+ of memory
  (Vercel sets this automatically, but if Booking/Airbnb start timing out
  in production, check the Function Logs first — the most common cause is
  a headless browser cold start).

## Adding a new source

1. Create `lib/providers/new-source.ts` implementing the `Provider`
   interface from `lib/providers/types.ts` (`search(params) =>
   Promise<Offer[]>`).
2. Register it in `lib/providers/index.ts`.
3. Done — orchestration, caching, sorting, and the UI work automatically
   for all registered providers.

## Notes on scraping fragility

All sources depend on the current HTML/DOM structure of the sites — if
search results stop coming back for a given source, the first step is to
check whether that site's structure changed (selectors live in the
corresponding `lib/providers/*.ts` file, with a comment noting what was
found where). Booking and Airbnb are extra sensitive since their anti-bot
protection can get stricter over time and start blocking the headless
browser too.

# last_minute
