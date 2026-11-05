export type Locale = "sr" | "en";

export const messages = {
  sr: {
    "header.siteName": "Last Minute Finder",
    "header.themeLight": "Svetla tema",
    "header.themeDark": "Tamna tema",
    "header.language": "Jezik",

    "home.badge": "Last minute",
    "home.titleStart": "Sve last minute ponude",
    "home.titleHighlight": "na jednom mestu",
    "home.subtitle":
      "Unesi destinaciju, period i broj osoba — prikupljamo dostupne ponude smeštaja i paket aranžmana umesto tebe.",
    "home.disclaimer":
      "Ponude se prikupljaju sa spoljnih sajtova i mogu povremeno kasniti ili nedostajati ako izvor privremeno nije dostupan. Rezervacija se uvek obavlja na sajtu agencije/izvora, ne ovde.",

    "search.destination": "Destinacija",
    "search.destinationPlaceholder": "Država, grad ili ostrvo",
    "search.period": "Period (mesec)",
    "search.periodShort": "Period",
    "search.monthAny": "Svejedno",
    "search.adults": "Odrasli",
    "search.children": "Deca",
    "search.travelers": "Putnici",
    "search.travelersDone": "Gotovo",
    "search.submitHero": "Pretraži ponude",
    "search.submit": "Pretraži",
    "search.orTry": "ili probaj:",
    "search.quick": "Brzo:",
    "search.emptyPrompt": "Unesi destinaciju da bi video ponude.",
    "search.resultsLabel": "Rezultati pretrage",
    "search.fetchError": "Pretraga nije uspela — probaj ponovo.",
    "search.sourcesPartial":
      "Neki izvori trenutno nisu dostupni ({sources}) — prikazani su rezultati iz ostalih izvora.",
    "search.monthHint":
      "Izabrani mesec služi kao orijentir — ponude koje ga pominju su na vrhu, ali prikazujemo i ostale jer se last minute termini stalno menjaju.",

    "progress.searching": "Pretražujemo ponude sa agencija…",
    "progress.starting": "Pokrećemo pretragu…",
    "progress.agencies": "agencija",
    "progress.offers": "ponuda",

    "filters.offers": "ponuda",
    "filters.sort": "Sortiraj",
    "filters.sortPriceAsc": "Najjeftinije",
    "filters.sortPriceDesc": "Najskuplje",
    "filters.sortDiscount": "Najveći popust",

    "providers.label": "Izvori ponuda",
    "providers.active": "aktivno",

    "results.emptyTitle": "Nema pronađenih ponuda za ovu pretragu.",
    "results.emptyHint":
      "Probaj drugu destinaciju ili širi period — last minute ponude se često menjaju.",

    "offer.transport.avion": "Avion",
    "offer.transport.autobus": "Autobus",
    "offer.transport.sopstveni": "Sopstveni prevoz",
    "offer.accommodation.hotel": "Hotel",
    "offer.accommodation.apartman": "Apartman",
    "offer.transportIncluded": "Prevoz uključen",
    "offer.ownTransport": "Sopstveni prevoz",
    "offer.moreRooms": "+{count} još soba na sajtu",
    "offer.perPerson": "/ osobi",
    "offer.totalFor": "ukupno za {count} {people}",
    "offer.priceOnRequest": "Cena na upit",
    "offer.roomTooSmall":
      "Najveća soba: {capacity} {people} — manje od traženog.",

    "people.adultOne": "odrasla",
    "people.adultMany": "odraslih",
    "people.childOne": "dete",
    "people.childMany": "dece",
    "people.one": "osoba",
    "people.few": "osobe",
    "search.placeSuggestion": "mesto",
    "search.errorDetails": "Detalji grešaka",
    "search.reconnecting": "Veza sa serverom je prekinuta — pokušavam ponovo…",
    "search.degraded": "Pretraga sa Booking.com, Airbnb i Filip Travel ovaj put nije uspela (server je prekinuo vezu), pa su prikazane ponude ostalih izvora. Probaj ponovo za koji minut.",
    "search.exactDates": "Tačni datumi",
    "search.flexible": "Fleksibilno",
    "search.checkin": "Polazak",
    "search.checkout": "Povratak",
    "search.flexibleHint": "Izaberi mesec ili ostavi „Svejedno“ za sve termine.",
    "search.datesInvalid": "Datum povratka mora biti posle polaska.",
    "search.countrySuggestion": "država",
    "results.placeHint": "Agencije nude celu državu ({country}) — ponude za {place} su prikazane prve.",
    "filters.title": "Filteri",
    "filters.reset": "Poništi sve",
    "filters.price": "Cena po osobi (€)",
    "filters.priceMin": "Od",
    "filters.priceMax": "Do",
    "filters.transport": "Prevoz",
    "filters.accommodation": "Smeštaj",
    "filters.board": "Ishrana",
    "filters.nights": "Trajanje",
    "filters.discountOnly": "Samo ponude sa popustom",
    "filters.rating": "Ocena gostiju",
    "filters.ratingAny": "Sve",
    "filters.search": "Traži u rezultatima",
    "filters.searchPlaceholder": "npr. bazen, plaža, Rimini",
    "filters.shown": "{shown} od {total}",
    "filters.sortRating": "Najbolja ocena",
    "filters.sortAi": "AI preporuka",
    "filters.noMatch": "Nijedna ponuda ne odgovara izabranim filterima.",
    "filters.toggle": "Filteri",
    "board.ai": "All inclusive",
    "board.fb": "Pun pansion",
    "board.hb": "Polupansion",
    "board.bb": "Doručak",
    "board.ro": "Bez ishrane",
    "nights.short": "Do 4 noći",
    "nights.week": "5–8 noći",
    "nights.long": "9+ noći",
    "external.title": "Proveri i na",
    "external.hint": "Otvara pretragu sa istom destinacijom, datumima i brojem gostiju.",
    "ai.title": "AI analiza",
    "ai.subtitle": "Gemini poredi ponude i bira one koje ti najviše odgovaraju.",
    "ai.prefsLabel": "Šta ti je važno?",
    "ai.prefsPlaceholder": "npr. mirno mesto blizu plaže, all inclusive, bazen za decu",
    "ai.run": "Analiziraj",
    "ai.rerun": "Analiziraj ponovo",
    "ai.loading": "AI analizira {count} ponuda…",
    "ai.notConfigured": "AI analiza nije uključena — na serveru nedostaje GEMINI_API_KEY.",
    "ai.rateLimited": "Dostignut je limit besplatnog AI plana. Probaj ponovo za minut.",
    "ai.error": "AI analiza trenutno nije uspela. Probaj ponovo.",
    "ai.fallbackNote": "Gemini trenutno ne odgovara (velika potražnja kod Google-a), pa je prikazan automatski izbor po ceni po noćenju, popustu, oceni, ishrani i prevozu. Klikni „Analiziraj ponovo“ za pravu AI analizu.",
    "ai.busy": "Gemini je trenutno preopterećen (velika potražnja kod Google-a). Probaj ponovo za minut-dva.",
    "ai.picks": "Najbolji izbor",
    "ai.insights": "Zapažanja",
    "ai.cautions": "Obrati pažnju",
    "ai.badge": "AI izbor #{rank}",
    "ai.match": "{score}% poklapanje",
    "ai.basedOn": "Analizirano {count} ponuda uz trenutne filtere.",
    "ai.disclaimer": "AI može da pogreši — detalje uvek proveri na sajtu ponude.",
    "ai.empty": "Nema ponuda za analizu uz trenutne filtere.",
    "offer.reviews": "{count} recenzija",
    "home.scroll": "Popularno ovog meseca",
    "people.many": "osoba",
  },
  en: {
    "header.siteName": "Last Minute Finder",
    "header.themeLight": "Light theme",
    "header.themeDark": "Dark theme",
    "header.language": "Language",

    "home.badge": "Last minute",
    "home.titleStart": "All last minute deals",
    "home.titleHighlight": "in one place",
    "home.subtitle":
      "Enter destination, dates and number of guests — we collect available accommodation and package deals for you.",
    "home.disclaimer":
      "Offers are collected from external sites and may occasionally be delayed or missing if a source is temporarily unavailable. Booking always happens on the agency/source site, not here.",

    "search.destination": "Destination",
    "search.destinationPlaceholder": "Country, city or island",
    "search.period": "Period (month)",
    "search.periodShort": "Period",
    "search.monthAny": "Any",
    "search.adults": "Adults",
    "search.children": "Children",
    "search.travelers": "Travelers",
    "search.travelersDone": "Done",
    "search.submitHero": "Search deals",
    "search.submit": "Search",
    "search.orTry": "or try:",
    "search.quick": "Quick:",
    "search.emptyPrompt": "Enter a destination to see offers.",
    "search.resultsLabel": "Search results",
    "search.fetchError": "Search failed — please try again.",
    "search.sourcesPartial":
      "Some sources are currently unavailable ({sources}) — showing results from other sources.",
    "search.monthHint":
      "The selected month is a guide — matching offers appear first, but we also show others because last minute dates change constantly.",

    "progress.searching": "Searching agency offers…",
    "progress.starting": "Starting search…",
    "progress.agencies": "agencies",
    "progress.offers": "offers",

    "filters.offers": "offers",
    "filters.sort": "Sort",
    "filters.sortPriceAsc": "Cheapest",
    "filters.sortPriceDesc": "Most expensive",
    "filters.sortDiscount": "Biggest discount",

    "providers.label": "Offer sources",
    "providers.active": "active",

    "results.emptyTitle": "No offers found for this search.",
    "results.emptyHint":
      "Try another destination or a wider date range — last minute deals change often.",

    "offer.transport.avion": "Flight",
    "offer.transport.autobus": "Bus",
    "offer.transport.sopstveni": "Own transport",
    "offer.accommodation.hotel": "Hotel",
    "offer.accommodation.apartman": "Apartment",
    "offer.transportIncluded": "Transport included",
    "offer.ownTransport": "Own transport",
    "offer.moreRooms": "+{count} more rooms on site",
    "offer.perPerson": "/ person",
    "offer.totalFor": "total for {count} {people}",
    "offer.priceOnRequest": "Price on request",
    "offer.roomTooSmall":
      "Largest room: {capacity} {people} — fewer than requested.",

    "people.adultOne": "adult",
    "people.adultMany": "adults",
    "people.childOne": "child",
    "people.childMany": "children",
    "people.one": "person",
    "people.few": "people",
    "search.placeSuggestion": "place",
    "search.errorDetails": "Error details",
    "search.reconnecting": "Connection to the server dropped — retrying…",
    "search.degraded": "Booking.com, Airbnb and Filip Travel failed this time (the server dropped the connection), so results from the other sources are shown. Try again in a few minutes.",
    "search.exactDates": "Exact dates",
    "search.flexible": "Flexible",
    "search.checkin": "Check-in",
    "search.checkout": "Check-out",
    "search.flexibleHint": "Pick a month or leave “Any” for all dates.",
    "search.datesInvalid": "Check-out must be after check-in.",
    "search.countrySuggestion": "country",
    "results.placeHint": "Agencies list the whole country ({country}) — offers for {place} are shown first.",
    "filters.title": "Filters",
    "filters.reset": "Clear all",
    "filters.price": "Price per person (€)",
    "filters.priceMin": "Min",
    "filters.priceMax": "Max",
    "filters.transport": "Transport",
    "filters.accommodation": "Accommodation",
    "filters.board": "Board",
    "filters.nights": "Length",
    "filters.discountOnly": "Discounted offers only",
    "filters.rating": "Guest rating",
    "filters.ratingAny": "Any",
    "filters.search": "Search in results",
    "filters.searchPlaceholder": "e.g. pool, beach, Rimini",
    "filters.shown": "{shown} of {total}",
    "filters.sortRating": "Top rated",
    "filters.sortAi": "AI pick",
    "filters.noMatch": "No offers match the selected filters.",
    "filters.toggle": "Filters",
    "board.ai": "All inclusive",
    "board.fb": "Full board",
    "board.hb": "Half board",
    "board.bb": "Breakfast",
    "board.ro": "Room only",
    "nights.short": "Up to 4 nights",
    "nights.week": "5–8 nights",
    "nights.long": "9+ nights",
    "external.title": "Also check on",
    "external.hint": "Opens a search with the same destination, dates and guests.",
    "ai.title": "AI analysis",
    "ai.subtitle": "Gemini compares the offers and picks the ones that suit you best.",
    "ai.prefsLabel": "What matters to you?",
    "ai.prefsPlaceholder": "e.g. quiet place near the beach, all inclusive, kids’ pool",
    "ai.run": "Analyze",
    "ai.rerun": "Analyze again",
    "ai.loading": "AI is analyzing {count} offers…",
    "ai.notConfigured": "AI analysis is off — GEMINI_API_KEY is missing on the server.",
    "ai.rateLimited": "The free AI plan limit was reached. Try again in a minute.",
    "ai.error": "AI analysis failed right now. Please try again.",
    "ai.fallbackNote": "Gemini is not responding right now (high demand at Google), so this is an automatic pick by price per night, discount, rating, board and transport. Click “Analyze again” for a real AI analysis.",
    "ai.busy": "Gemini is overloaded right now (high demand at Google). Try again in a minute or two.",
    "ai.picks": "Best picks",
    "ai.insights": "Insights",
    "ai.cautions": "Watch out",
    "ai.badge": "AI pick #{rank}",
    "ai.match": "{score}% match",
    "ai.basedOn": "Analyzed {count} offers with the current filters.",
    "ai.disclaimer": "AI can be wrong — always check details on the offer’s site.",
    "ai.empty": "No offers to analyze with the current filters.",
    "offer.reviews": "{count} reviews",
    "home.scroll": "Popular this month",
    "people.many": "people",
  },
} as const;

export type MessageKey = keyof typeof messages.sr;

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key] ?? messages.sr[key];
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(vars[name] ?? `{${name}}`)
  );
}

export function peopleWord(count: number, locale: Locale): string {
  if (locale === "en") return count === 1 ? messages.en["people.one"] : messages.en["people.few"];
  if (count === 1) return messages.sr["people.one"];
  if (count >= 2 && count <= 4) return messages.sr["people.few"];
  return messages.sr["people.many"];
}

export function formatGuests(
  adults: number,
  children: number,
  locale: Locale
): string {
  const adultLabel =
    locale === "en"
      ? `${adults} ${adults === 1 ? messages.en["people.adultOne"] : messages.en["people.adultMany"]}`
      : `${adults} ${adults === 1 ? messages.sr["people.adultOne"] : messages.sr["people.adultMany"]}`;

  if (children <= 0) return adultLabel;

  const childLabel =
    locale === "en"
      ? `${children} ${children === 1 ? messages.en["people.childOne"] : messages.en["people.childMany"]}`
      : `${children} ${children === 1 ? messages.sr["people.childOne"] : messages.sr["people.childMany"]}`;

  return `${adultLabel} · ${childLabel}`;
}
