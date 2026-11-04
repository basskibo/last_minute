/**
 * Vizuelne teme strane rezultata po državi. Tema menja samo tokene boja
 * (vidi [data-dest-theme] u app/globals.css) i motiv u traci na vrhu —
 * raspored i komponente ostaju isti.
 */
export type DestinationThemeId =
  | "italy"
  | "greece"
  | "spain"
  | "turkey"
  | "croatia"
  | "montenegro"
  | "egypt"
  | "france"
  | "coast";

export interface DestinationTheme {
  id: DestinationThemeId;
  /** Pozdrav na lokalnom jeziku */
  greeting: string;
  /** BCP 47 jezik pozdrava (za čitače ekrana) */
  lang?: string;
  /** Kratka linija ispod naslova */
  tagline: { sr: string; en: string };
}

const THEMES: Record<string, DestinationTheme> = {
  Italija: {
    id: "italy",
    greeting: "Benvenuti in Italia",
    lang: "it",
    tagline: { sr: "Pasta, piazza i more — dolce vita po last minute ceni.", en: "Pasta, piazzas and the sea — dolce vita at a last-minute price." },
  },
  Grčka: {
    id: "greece",
    greeting: "Καλώς ήρθατε",
    lang: "el",
    tagline: { sr: "Plavo-belo leto, taverne i ostrva.", en: "Blue-and-white summer, tavernas and islands." },
  },
  Španija: {
    id: "spain",
    greeting: "¡Bienvenidos a España!",
    lang: "es",
    tagline: { sr: "Sunce, tapas i fiesta do kasno u noć.", en: "Sun, tapas and fiesta late into the night." },
  },
  Turska: {
    id: "turkey",
    greeting: "Hoş geldiniz",
    lang: "tr",
    tagline: { sr: "All inclusive, bazari i tirkizno more.", en: "All inclusive, bazaars and a turquoise sea." },
  },
  Hrvatska: {
    id: "croatia",
    greeting: "Dobrodošli u Hrvatsku",
    lang: "hr",
    tagline: { sr: "Hiljadu ostrva i kamene uvale.", en: "A thousand islands and stone coves." },
  },
  "Crna Gora": {
    id: "montenegro",
    greeting: "Dobrodošli u Crnu Goru",
    lang: "sr",
    tagline: { sr: "Planine koje se spuštaju pravo u more.", en: "Mountains that drop straight into the sea." },
  },
  Egipat: {
    id: "egypt",
    greeting: "أهلاً وسهلاً",
    lang: "ar",
    tagline: { sr: "Piramide, korali i sunce cele godine.", en: "Pyramids, reefs and year-round sun." },
  },
  Francuska: {
    id: "france",
    greeting: "Bienvenue en France",
    lang: "fr",
    tagline: { sr: "Kroasan ujutru, Azurna obala popodne.", en: "Croissants in the morning, the Riviera by afternoon." },
  },
};

const DEFAULT_THEME: DestinationTheme = {
  id: "coast",
  greeting: "",
  tagline: { sr: "Sve last minute ponude za ovu destinaciju na jednom mestu.", en: "Every last-minute deal for this destination in one place." },
};

export function themeForCountry(country?: string): DestinationTheme {
  return (country && THEMES[country]) || DEFAULT_THEME;
}
