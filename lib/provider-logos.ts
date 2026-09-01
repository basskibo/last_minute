/** Logo agencije/izvora — prikazuje se kad ponuda nema cover sliku. */
export const PROVIDER_LOGOS: Record<string, string> = {
  argus: "https://argus.rs/images/argus_logo.png",
  oktopod: "https://www.oktopod.rs/assets/media/logos/oktopod-travel-logo.svg",
  travelland: "https://www.travelland.rs/wp-content/uploads/logo-travelland.png",
  grandtours: "https://grandtours.rs/wp-content/uploads/2023/12/cropped-cropped-logo.png",
  booking: "https://cf.bstatic.com/static/img/favicon/favicon-512.png",
  airbnb: "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-PlatformFavicons/original/10_2025070909160716840502a3392f364.png",
};

export function getProviderLogo(providerId: string): string | undefined {
  return PROVIDER_LOGOS[providerId];
}
