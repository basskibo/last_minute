/**
 * Destinacije: korisnik može da upiše državu, grad, ostrvo ili regiju.
 *
 * - Agencijski izvori (lastminuteponude, Oktopod, Argus…) pretražuju po
 *   DRŽAVI — zato se mesto mapira na državu (Barselona → Španija).
 * - Booking/Airbnb rade sa bilo kojim mestom, a najbolje sa engleskim
 *   nazivom (Barcelona, Greece) — zato svaka stavka nosi i `en`.
 *
 * Nepoznata mesta (van ovog rečnika) server može da reši preko AI-ja
 * (vidi lib/ai/resolve-destination.ts); bez AI-ja se tekst šalje kakav jeste.
 */

export interface DestinationEntry {
  /** Prikazni naziv (srpski) */
  name: string;
  /** Engleski naziv za Booking/Airbnb */
  en: string;
  /** Država (ključ iz LMP_COUNTRIES); za samu državu = name */
  country: string;
  kind: "country" | "place";
  /** Dodatni nazivi/pravopisi za prepoznavanje */
  aliases?: string[];
}

const COUNTRY_EN: Record<string, string> = {
  Andora: "Andorra",
  Austrija: "Austria",
  "Bosna i Hercegovina": "Bosnia and Herzegovina",
  Bugarska: "Bulgaria",
  Češka: "Czech Republic",
  "Crna Gora": "Montenegro",
  Danska: "Denmark",
  Estonija: "Estonia",
  Finska: "Finland",
  Francuska: "France",
  Grčka: "Greece",
  Holandija: "Netherlands",
  Hrvatska: "Croatia",
  Irska: "Ireland",
  Island: "Iceland",
  Italija: "Italy",
  Kipar: "Cyprus",
  Letonija: "Latvia",
  Litvanija: "Lithuania",
  Makedonija: "North Macedonia",
  Malta: "Malta",
  Mađarska: "Hungary",
  Monako: "Monaco",
  Nemačka: "Germany",
  Norveška: "Norway",
  Poljska: "Poland",
  Portugalija: "Portugal",
  Rumunija: "Romania",
  Rusija: "Russia",
  "San Marino": "San Marino",
  Škotska: "Scotland",
  Slovačka: "Slovakia",
  Slovenija: "Slovenia",
  Španija: "Spain",
  Srbija: "Serbia",
  Švajcarska: "Switzerland",
  Švedska: "Sweden",
  Turska: "Turkey",
  "Velika Britanija": "United Kingdom",
  Alžir: "Algeria",
  Egipat: "Egypt",
  Kenija: "Kenya",
  Maroko: "Morocco",
  Mauricijus: "Mauritius",
  Sejšeli: "Seychelles",
  Tanzanija: "Tanzania",
  Tunis: "Tunisia",
  Brunej: "Brunei",
  Filipini: "Philippines",
  Indija: "India",
  Indonezija: "Indonesia",
  Japan: "Japan",
  "Južna Koreja": "South Korea",
  Kazahstan: "Kazakhstan",
  Kina: "China",
  Kirgistan: "Kyrgyzstan",
  Maldivi: "Maldives",
  Malezija: "Malaysia",
  Oman: "Oman",
  Singapur: "Singapore",
  "Šri Lanka": "Sri Lanka",
  Tajland: "Thailand",
  "Ujedinjeni Arapski Emirati": "United Arab Emirates",
  Vijetnam: "Vietnam",
  Australija: "Australia",
  Aljaska: "Alaska",
  Bahami: "Bahamas",
  Barbados: "Barbados",
  "Dominikanska Republika": "Dominican Republic",
  Kanada: "Canada",
  Kuba: "Cuba",
  Meksiko: "Mexico",
  Portoriko: "Puerto Rico",
  "Sjedinjene Američke Države": "United States",
  Argentina: "Argentina",
  Bolivija: "Bolivia",
  Brazil: "Brazil",
  Čile: "Chile",
  Honduras: "Honduras",
  Karibi: "Caribbean",
  Kolumbija: "Colombia",
  Peru: "Peru",
  Urugvaj: "Uruguay",
  Albanija: "Albania",
};

/** [srpski naziv, engleski naziv, država, aliasi?] */
const PLACES: [string, string, string, string[]?][] = [
  // Španija
  ["Barselona", "Barcelona", "Španija", ["barcelona", "barca"]],
  ["Madrid", "Madrid", "Španija"],
  ["Majorka", "Mallorca", "Španija", ["mallorca", "palma de majorka", "palma"]],
  ["Ibica", "Ibiza", "Španija", ["ibiza"]],
  ["Tenerife", "Tenerife", "Španija"],
  ["Gran Kanarija", "Gran Canaria", "Španija", ["gran canaria"]],
  ["Kanarska ostrva", "Canary Islands", "Španija", ["kanari", "canary islands"]],
  ["Malaga", "Malaga", "Španija"],
  ["Kosta Brava", "Costa Brava", "Španija", ["costa brava"]],
  ["Kosta del Sol", "Costa del Sol", "Španija", ["costa del sol"]],
  ["Valensija", "Valencia", "Španija", ["valencia"]],
  ["Sevilja", "Seville", "Španija", ["sevilla", "seville"]],
  ["Benidorm", "Benidorm", "Španija"],
  // Grčka
  ["Krit", "Crete", "Grčka", ["crete", "kriti"]],
  ["Rodos", "Rhodes", "Grčka", ["rhodes", "rodos"]],
  ["Krf", "Corfu", "Grčka", ["corfu", "kerkira"]],
  ["Tasos", "Thassos", "Grčka", ["thassos", "thasos"]],
  ["Halkidiki", "Halkidiki", "Grčka", ["halkidiki", "chalkidiki", "kasandra", "sitonija", "hanioti", "pefkohori", "polihrono"]],
  ["Zakintos", "Zakynthos", "Grčka", ["zakynthos", "zante"]],
  ["Kefalonija", "Kefalonia", "Grčka", ["kefalonia", "cefalonia"]],
  ["Lefkada", "Lefkada", "Grčka", ["lefkas"]],
  ["Santorini", "Santorini", "Grčka"],
  ["Mikonos", "Mykonos", "Grčka", ["mykonos"]],
  ["Atina", "Athens", "Grčka", ["athens"]],
  ["Solun", "Thessaloniki", "Grčka", ["thessaloniki"]],
  ["Parga", "Parga", "Grčka"],
  ["Olimpska regija", "Pieria", "Grčka", ["paralija", "olimpik bič", "leptokarija", "nei pori"]],
  ["Evija", "Evia", "Grčka", ["evia", "eubea"]],
  ["Kos", "Kos", "Grčka"],
  ["Paros", "Paros", "Grčka"],
  ["Naksos", "Naxos", "Grčka", ["naxos"]],
  ["Skijatos", "Skiathos", "Grčka", ["skiathos"]],
  ["Peloponez", "Peloponnese", "Grčka", ["peloponnese"]],
  // Turska
  ["Antalija", "Antalya", "Turska", ["antalya"]],
  ["Alanja", "Alanya", "Turska", ["alanya"]],
  ["Kemer", "Kemer", "Turska"],
  ["Side", "Side", "Turska"],
  ["Belek", "Belek", "Turska"],
  ["Bodrum", "Bodrum", "Turska"],
  ["Marmaris", "Marmaris", "Turska"],
  ["Kušadasi", "Kusadasi", "Turska", ["kusadasi"]],
  ["Istanbul", "Istanbul", "Turska", ["carigrad"]],
  ["Didim", "Didim", "Turska"],
  ["Fetije", "Fethiye", "Turska", ["fethiye"]],
  // Crna Gora
  ["Budva", "Budva", "Crna Gora"],
  ["Ulcinj", "Ulcinj", "Crna Gora"],
  ["Herceg Novi", "Herceg Novi", "Crna Gora"],
  ["Kotor", "Kotor", "Crna Gora"],
  ["Tivat", "Tivat", "Crna Gora"],
  ["Bar", "Bar", "Crna Gora"],
  ["Petrovac", "Petrovac", "Crna Gora"],
  ["Sutomore", "Sutomore", "Crna Gora"],
  ["Bečići", "Becici", "Crna Gora", ["becici"]],
  ["Žabljak", "Zabljak", "Crna Gora", ["zabljak"]],
  // Hrvatska
  ["Split", "Split", "Hrvatska"],
  ["Dubrovnik", "Dubrovnik", "Hrvatska"],
  ["Zadar", "Zadar", "Hrvatska"],
  ["Pula", "Pula", "Hrvatska"],
  ["Makarska", "Makarska", "Hrvatska"],
  ["Rovinj", "Rovinj", "Hrvatska"],
  ["Hvar", "Hvar", "Hrvatska"],
  ["Istra", "Istria", "Hrvatska", ["istria"]],
  ["Zagreb", "Zagreb", "Hrvatska"],
  // Italija
  ["Rim", "Rome", "Italija", ["roma", "rome"]],
  ["Venecija", "Venice", "Italija", ["venezia", "venice"]],
  ["Milano", "Milan", "Italija", ["milan"]],
  ["Firenca", "Florence", "Italija", ["firenze", "florence"]],
  ["Napulj", "Naples", "Italija", ["napoli", "naples"]],
  ["Sicilija", "Sicily", "Italija", ["sicily", "sicilia"]],
  ["Sardinija", "Sardinia", "Italija", ["sardinia", "sardegna"]],
  ["Rimini", "Rimini", "Italija"],
  ["Lido di Jesolo", "Lido di Jesolo", "Italija", ["jesolo"]],
  ["Amalfi", "Amalfi Coast", "Italija", ["amalfijska obala"]],
  ["Kalabrija", "Calabria", "Italija", ["calabria"]],
  ["Toskana", "Tuscany", "Italija", ["tuscany", "toscana"]],
  // Ostala Evropa
  ["Pariz", "Paris", "Francuska", ["paris"]],
  ["Nica", "Nice", "Francuska", ["nice"]],
  ["Azurna obala", "French Riviera", "Francuska", ["cote d'azur", "côte d'azur"]],
  ["Prag", "Prague", "Češka", ["praha", "prague"]],
  ["Beč", "Vienna", "Austrija", ["bec", "wien", "vienna"]],
  ["Budimpešta", "Budapest", "Mađarska", ["budimpesta", "budapest"]],
  ["Hevic", "Heviz", "Mađarska", ["heviz", "hévíz"]],
  ["Berlin", "Berlin", "Nemačka"],
  ["Minhen", "Munich", "Nemačka", ["munich", "münchen"]],
  ["London", "London", "Velika Britanija"],
  ["Amsterdam", "Amsterdam", "Holandija"],
  ["Lisabon", "Lisbon", "Portugalija", ["lisbon", "lisboa"]],
  ["Porto", "Porto", "Portugalija"],
  ["Madeira", "Madeira", "Portugalija"],
  ["Algarve", "Algarve", "Portugalija"],
  ["Ajija Napa", "Ayia Napa", "Kipar", ["ayia napa", "agia napa"]],
  ["Larnaka", "Larnaca", "Kipar", ["larnaca"]],
  ["Pafos", "Paphos", "Kipar", ["paphos"]],
  ["Sunčev breg", "Sunny Beach", "Bugarska", ["suncev breg", "sunny beach"]],
  ["Nesebar", "Nessebar", "Bugarska", ["nessebar"]],
  ["Zlatni pjasci", "Golden Sands", "Bugarska", ["golden sands"]],
  ["Bansko", "Bansko", "Bugarska"],
  ["Ohrid", "Ohrid", "Makedonija"],
  ["Ljubljana", "Ljubljana", "Slovenija"],
  ["Portorož", "Portoroz", "Slovenija", ["portoroz"]],
  ["Zlatibor", "Zlatibor", "Srbija"],
  ["Kopaonik", "Kopaonik", "Srbija"],
  ["Beograd", "Belgrade", "Srbija", ["belgrade"]],
  ["Sarajevo", "Sarajevo", "Bosna i Hercegovina"],
  ["Neum", "Neum", "Bosna i Hercegovina"],
  ["Drač", "Durres", "Albanija", ["durres", "drac"]],
  ["Saranda", "Sarande", "Albanija", ["sarande"]],
  ["Valona", "Vlore", "Albanija", ["vlore", "vlora"]],
  // Afrika / Bliski istok / Azija
  ["Hurgada", "Hurghada", "Egipat", ["hurghada"]],
  ["Šarm el Šeik", "Sharm El Sheikh", "Egipat", ["sarm el seik", "sharm el sheikh", "sharm"]],
  ["Marsa Alam", "Marsa Alam", "Egipat"],
  ["Hamamet", "Hammamet", "Tunis", ["hammamet"]],
  ["Sus", "Sousse", "Tunis", ["sousse"]],
  ["Monastir", "Monastir", "Tunis"],
  ["Džerba", "Djerba", "Tunis", ["djerba", "dzerba"]],
  ["Marakeš", "Marrakech", "Maroko", ["marakes", "marrakech", "marrakesh"]],
  ["Zanzibar", "Zanzibar", "Tanzanija"],
  ["Dubai", "Dubai", "Ujedinjeni Arapski Emirati", ["dubaj"]],
  ["Abu Dabi", "Abu Dhabi", "Ujedinjeni Arapski Emirati", ["abu dhabi"]],
  ["Bali", "Bali", "Indonezija"],
  ["Puket", "Phuket", "Tajland", ["phuket"]],
  ["Bangkok", "Bangkok", "Tajland"],
  ["Pataja", "Pattaya", "Tajland", ["pattaya"]],
  ["Tokio", "Tokyo", "Japan", ["tokyo"]],
  ["Njujork", "New York", "Sjedinjene Američke Države", ["new york", "nyc"]],
  ["Kankun", "Cancun", "Meksiko", ["cancun", "cancún"]],
  ["Punta Kana", "Punta Cana", "Dominikanska Republika", ["punta cana"]],
];

function buildEntries(): DestinationEntry[] {
  const countries: DestinationEntry[] = Object.entries(COUNTRY_EN).map(([name, en]) => ({
    name,
    en,
    country: name,
    kind: "country",
    aliases: [en.toLowerCase()],
  }));
  const places: DestinationEntry[] = PLACES.map(([name, en, country, aliases]) => ({
    name,
    en,
    country,
    kind: "place",
    aliases,
  }));
  return [...countries, ...places];
}

export const DESTINATIONS: DestinationEntry[] = buildEntries();

/** Mala slova, bez dijakritika, đ → dj — za poređenje. */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keysOf(entry: DestinationEntry): string[] {
  return [entry.name, entry.en, ...(entry.aliases ?? [])].map(normalizeText);
}

/** Tačno poklapanje naziva ili aliasa. */
export function findDestination(query: string): DestinationEntry | null {
  const q = normalizeText(query);
  if (!q) return null;
  return DESTINATIONS.find((d) => keysOf(d).includes(q)) ?? null;
}

/** Predlozi za combobox: prvo oni koji počinju upitom, pa oni koji ga sadrže. */
export function suggestDestinations(query: string, limit = 8): DestinationEntry[] {
  const q = normalizeText(query);
  if (!q) return [];
  const exact: DestinationEntry[] = [];
  const starts: DestinationEntry[] = [];
  const contains: DestinationEntry[] = [];
  for (const d of DESTINATIONS) {
    const keys = keysOf(d);
    if (keys.includes(q)) exact.push(d);
    else if (keys.some((k) => k.startsWith(q))) starts.push(d);
    else if (keys.some((k) => k.includes(q))) contains.push(d);
  }
  return [...exact, ...starts, ...contains].slice(0, limit);
}

export interface ResolvedDestination {
  /** Ono što je korisnik upisao */
  query: string;
  /** Država za agencijske izvore (ključ iz LMP_COUNTRIES), ako je poznata */
  country?: string;
  /** Konkretno mesto unutar države (za rangiranje agencijskih ponuda) */
  place?: DestinationEntry;
  /** Naziv za Booking/Airbnb */
  bookingQuery: string;
}

export function resolveDestinationLocal(query: string): ResolvedDestination {
  const entry = findDestination(query);
  if (!entry) return { query, bookingQuery: query };
  return {
    query,
    country: entry.country,
    place: entry.kind === "place" ? entry : undefined,
    bookingQuery: entry.kind === "place" ? `${entry.en}, ${COUNTRY_EN[entry.country] ?? entry.country}` : entry.en,
  };
}


/** ISO 3166-1 alpha-2 — Booking za države koristi kod kao dest_id (dest_type=country). */
const COUNTRY_ISO: Record<string, string> = {
  Andora: "ad", Austrija: "at", "Bosna i Hercegovina": "ba", Bugarska: "bg", Češka: "cz",
  "Crna Gora": "me", Danska: "dk", Estonija: "ee", Finska: "fi", Francuska: "fr", Grčka: "gr",
  Holandija: "nl", Hrvatska: "hr", Irska: "ie", Island: "is", Italija: "it", Kipar: "cy",
  Letonija: "lv", Litvanija: "lt", Makedonija: "mk", Malta: "mt", Mađarska: "hu", Monako: "mc",
  Nemačka: "de", Norveška: "no", Poljska: "pl", Portugalija: "pt", Rumunija: "ro", Rusija: "ru",
  "San Marino": "sm", Škotska: "gb", Slovačka: "sk", Slovenija: "si", Španija: "es", Srbija: "rs",
  Švajcarska: "ch", Švedska: "se", Turska: "tr", "Velika Britanija": "gb", Alžir: "dz", Egipat: "eg",
  Kenija: "ke", Maroko: "ma", Mauricijus: "mu", Sejšeli: "sc", Tanzanija: "tz", Tunis: "tn",
  Brunej: "bn", Filipini: "ph", Indija: "in", Indonezija: "id", Japan: "jp", "Južna Koreja": "kr",
  Kazahstan: "kz", Kina: "cn", Kirgistan: "kg", Maldivi: "mv", Malezija: "my", Oman: "om",
  Singapur: "sg", "Šri Lanka": "lk", Tajland: "th", "Ujedinjeni Arapski Emirati": "ae",
  Vijetnam: "vn", Australija: "au", Aljaska: "us", Bahami: "bs", Barbados: "bb",
  "Dominikanska Republika": "do", Kanada: "ca", Kuba: "cu", Meksiko: "mx", Portoriko: "pr",
  "Sjedinjene Američke Države": "us", Argentina: "ar", Bolivija: "bo", Brazil: "br", Čile: "cl",
  Honduras: "hn", Kolumbija: "co", Peru: "pe", Urugvaj: "uy", Albanija: "al",
};

export function countryIsoCode(country?: string): string | undefined {
  return country ? COUNTRY_ISO[country] : undefined;
}

export function countryEnglishName(country: string): string | undefined {
  return COUNTRY_EN[country];
}

/** Da li tekst ponude pominje dato mesto (bilo kojim nazivom/aliasom). */
export function offerMentionsPlace(text: string, place: DestinationEntry): boolean {
  const haystack = ` ${normalizeText(text)} `;
  return keysOf(place).some((k) => k.length >= 3 && haystack.includes(` ${k}`));
}
