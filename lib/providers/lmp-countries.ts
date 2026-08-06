/**
 * Mapa naziv države -> ID koji lastminuteponude.com koristi u parametru "drzava".
 * Izvučeno iz <select id="fs_drzave"> na https://www.lastminuteponude.com/last-minute/Grčka
 */
export const LMP_COUNTRIES: Record<string, number> = {
  Andora: 1056,
  Austrija: 8,
  "Bosna i Hercegovina": 11,
  Bugarska: 12,
  Češka: 13,
  "Crna Gora": 14,
  Danska: 15,
  Estonija: 537,
  Finska: 16,
  Francuska: 17,
  Grčka: 18,
  Holandija: 19,
  Hrvatska: 20,
  Irska: 21,
  Island: 2096,
  Italija: 22,
  Kipar: 23,
  Letonija: 1077,
  Litvanija: 1076,
  Makedonija: 24,
  Malta: 25,
  Mađarska: 26,
  Monako: 27,
  Nemačka: 28,
  Norveška: 29,
  Poljska: 30,
  Portugalija: 31,
  Rumunija: 32,
  Rusija: 33,
  "San Marino": 34,
  Škotska: 2329,
  Slovačka: 35,
  Slovenija: 36,
  Španija: 37,
  Srbija: 38,
  Švajcarska: 39,
  Švedska: 40,
  Turska: 41,
  "Velika Britanija": 43,
  Alžir: 2319,
  Egipat: 44,
  Kenija: 45,
  Maroko: 47,
  Mauricijus: 48,
  Sejšeli: 49,
  Tanzanija: 1287,
  Tunis: 50,
  Brunej: 53,
  Filipini: 54,
  Indija: 55,
  Indonezija: 56,
  Japan: 58,
  "Južna Koreja": 60,
  Kazahstan: 1430,
  Kina: 62,
  Kirgistan: 1427,
  Maldivi: 64,
  Malezija: 65,
  Oman: 1367,
  Singapur: 66,
  "Šri Lanka": 68,
  Tajland: 69,
  "Ujedinjeni Arapski Emirati": 70,
  Vijetnam: 596,
  Australija: 72,
  Aljaska: 2367,
  Bahami: 74,
  Barbados: 75,
  "Dominikanska Republika": 76,
  Kanada: 78,
  Kuba: 79,
  Meksiko: 80,
  Portoriko: 81,
  "Sjedinjene Američke Države": 82,
  Argentina: 83,
  Bolivija: 84,
  Brazil: 85,
  Čile: 86,
  Honduras: 2349,
  Karibi: 2069,
  Kolumbija: 87,
  Peru: 89,
  Urugvaj: 1441,
};

export const LMP_POPULAR_DESTINATIONS = [
  "Grčka",
  "Turska",
  "Crna Gora",
  "Hrvatska",
  "Španija",
  "Italija",
  "Tunis",
  "Egipat",
  "Bugarska",
];

export function findLmpCountryId(destination: string): number | null {
  const normalized = destination.trim().toLowerCase();
  const exact = Object.entries(LMP_COUNTRIES).find(
    ([name]) => name.toLowerCase() === normalized
  );
  if (exact) return exact[1];

  const partial = Object.entries(LMP_COUNTRIES).find(
    ([name]) =>
      name.toLowerCase().includes(normalized) ||
      normalized.includes(name.toLowerCase())
  );
  return partial ? partial[1] : null;
}
