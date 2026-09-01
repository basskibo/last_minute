import { normalizeDestinationKey } from "./scrape-utils";

/** Argus: /aranzmani/letovanje/{slug} */
const ARGUS_LETOVANJE: Record<string, string> = {
  albanija: "albanija",
  "crna gora": "crna-gora",
  grcka: "grcka",
  kipar: "kipar",
  malta: "malta",
  spanija: "spanija",
  turska: "turska",
};

/** Travelland: countryId u /services/list/ */
const TRAVELLAND_COUNTRY_IDS: Record<string, number> = {
  grcka: 89,
  turska: 225,
  spanija: 68,
  "crna gora": 140,
};

/** Grand Tours: tour_type-* tagovi na wp-json tour objektima */
const GRANDTOURS_TOUR_TYPES: Record<string, string[]> = {
  grcka: ["grcka-leto", "grcka-leto-2026"],
  "crna gora": ["crna-gora-leto"],
  turska: ["turska-leto"],
  spanija: ["spanija-leto"],
  italija: ["italija-leto"],
  albanija: ["albanija-leto"],
  tunis: ["tunis-leto"],
};

const GRANDTOURS_HIT_KEYWORDS: Record<string, RegExp> = {
  grcka:
    /haniot|halkidik|tasos|evia|olymp|parga|lefkad|krf|krf|atina|solun|pelop|agia|vrasna|edipsos|hani/i,
  "crna gora": /ulcinj|budva|beči|beci|tivat|kotor|bar |crna/i,
  turska: /istanbul|bodrum|kusadas|marmaris|alanja|kemer|antal/i,
};

function lookup<T>(map: Record<string, T>, destination: string): T | null {
  const key = normalizeDestinationKey(destination);
  if (map[key]) return map[key];
  const partial = Object.entries(map).find(
    ([name]) => key.includes(name) || name.includes(key)
  );
  return partial ? partial[1] : null;
}

export function findArgusLetovanjeSlug(destination: string): string | null {
  return lookup(ARGUS_LETOVANJE, destination);
}

export function findTravellandCountryId(destination: string): number | null {
  return lookup(TRAVELLAND_COUNTRY_IDS, destination);
}

export function findGrandToursTourTypes(destination: string): string[] | null {
  return lookup(GRANDTOURS_TOUR_TYPES, destination);
}

export function grandToursHitKeyword(destination: string): RegExp | null {
  return lookup(GRANDTOURS_HIT_KEYWORDS, destination);
}
