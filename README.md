# Poslednji Trenutak

Agregator last-minute ponuda smeštaja i paket aranžmana. Korisnik unese
destinaciju, fleksibilan period (mesec) i broj osoba (odrasli/deca) —
aplikacija prikuplja dostupne ponude sa više izvora i prikazuje ih na jednom
mestu, sortirane po ceni ili popustu.

## Kako radi

- **Nema baze podataka.** Rezultati se dobijaju uživo scrape-ovanjem izvora
  pri svakoj pretrazi, uz opciono kratkotrajno keširanje (par sati) preko
  Upstash Redis-a da se ne opterećuju izvori i da odgovor bude brz.
- **Izvori (`lib/providers/`):**
  - `lastminuteponude.ts` — obično HTML scrape-ovanje (cheerio/fetch) sajta
    [lastminuteponude.com](https://www.lastminuteponude.com), koji sam po
    sebi agregira desetine srpskih agencija (Oktopod, Sole Azur, Viva
    Travel, Astra Travel, Hedonic Travel i dr.).
  - `oktopod.ts` — HTML scrape tabele cena po smeštaju/terminu/sobnosti,
    trenutno mapirano samo za Grčku (jedina potvrđena stranica sa
    strukturiranom tabelom — ostale Oktopod kampanje su PDF/najave bez
    parsabilnih podataka).
  - `booking.ts`, `airbnb.ts` — **headless browser (Playwright)**. Oba sajta
    blokiraju obične HTTP zahteve (Booking odmah vraća AWS WAF JS-challenge;
    Airbnb renderuje sve klijentski), pa se koristi pravi Chromium
    (`lib/browser.ts`) koji izvrši JS i pročita rezultate iz DOM-a. Sporije
    od običnog fetch-a (par sekundi po pretrazi) i osetljivije na promene
    DOM strukture izvora.
- Svaki izvor ima svoj timeout i pada nezavisno (`Promise.allSettled` u
  `lib/search.ts`) — ako jedan izvor otkaže, ostali i dalje rade. Rezultati
  koji nemaju detaljnu sobnost (Booking/Airbnb/lastminuteponude) prikazuju
  aproksimaciju "ukupno" (cena × broj osoba); Oktopod ima stvarnu tabelu
  sobnosti pa bira sobu čiji kapacitet najbolje odgovara traženom broju
  osoba (`lib/rooms.ts`).

## Pokretanje lokalno

```bash
npm install
npx playwright install chromium
npm run dev
```

Otvori `http://localhost:3000`. `playwright install chromium` je
jednokratno i preuzima lokalni browser za Booking/Airbnb providere (ne ide u
produkcijski build — na Vercelu se koristi `@sparticuz/chromium`, vidi ispod).

## Environment varijable

Kopiraj `.env.example` u `.env.local` ako želiš keširanje:

```bash
cp .env.example .env.local
```

- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — Upstash Redis REST kredencijali.
  Na Vercelu: Project → Storage → dodaj Redis (Marketplace) integraciju, ona
  automatski postavi ove varijable. Bez njih app radi normalno, samo bez keša.

## Deploy na Vercel

```bash
npx vercel
```

ili poveži repo direktno u Vercel dashboardu. Nakon prvog deploy-a, po želji
dodaj Redis integraciju za keširanje (Storage tab u projektu).

**Napomena za Booking/Airbnb (Playwright):**
- `@sparticuz/chromium` i `playwright-core` su podešeni kao
  `serverExternalPackages` u `next.config.ts` da im native binarni fajlovi
  ne budu pokvareni bundlovanjem.
- `/api/search` i `/search` imaju `maxDuration = 60` (Vercel Hobby dozvoljava
  do 60s, Pro do 300s) jer headless pretraga ume da potraje.
- Serverless funkcija treba realno makar 1024MB+ memorije (Vercel podešava
  automatski, ali ako Booking/Airbnb počnu da timeout-uju u produkciji, prvo
  proveriti Function Logs — najčešći uzrok je cold start headless browsera).

## Dodavanje novog izvora

1. Napravi `lib/providers/novi-izvor.ts` koji implementira `Provider` iz
   `lib/providers/types.ts` (`search(params) => Promise<Offer[]>`).
2. Registruj ga u `lib/providers/index.ts`.
3. Gotovo — orkestracija, keširanje, sortiranje i UI rade automatski za sve
   registrovane provajdere.

## Napomene o krhkosti scrapinga

Svi izvori zavise od trenutne HTML/DOM strukture sajtova — ako pretraga za
neki izvor prestane da vraća rezultate, prvi korak je proveriti da li se
struktura na tom sajtu promenila (selektori su u odgovarajućem
`lib/providers/*.ts` fajlu, uz komentar gde je šta pronađeno). Booking i
Airbnb su dodatno osetljivi jer njihova anti-bot zaštita može vremenom da
postane stroža i počne da blokira i headless browser.
# last_minute
