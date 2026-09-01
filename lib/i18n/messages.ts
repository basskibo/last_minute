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
    "search.destinationPlaceholder": "npr. Grčka",
    "search.period": "Period (mesec)",
    "search.periodShort": "Period",
    "search.monthAny": "Svejedno",
    "search.adults": "Odrasli",
    "search.children": "Deca",
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
    "search.destinationPlaceholder": "e.g. Greece",
    "search.period": "Period (month)",
    "search.periodShort": "Period",
    "search.monthAny": "Any",
    "search.adults": "Adults",
    "search.children": "Children",
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
