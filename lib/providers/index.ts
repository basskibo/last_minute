import type { Provider } from "./types";
import { lastMinutePonudeProvider } from "./lastminuteponude";
import { oktopodProvider } from "./oktopod";
import { argusProvider } from "./argus";
import { travellandProvider } from "./travelland";
import { grandToursProvider } from "./grandtours";
import { filipTravelProvider } from "./filiptravel";
import { bookingProvider } from "./booking";
import { airbnbProvider } from "./airbnb";

/** Redosled = redosled u listi izvora u UI-ju; Booking i Airbnb su prioritet. */
export const providers: Provider[] = [
  bookingProvider,
  airbnbProvider,
  lastMinutePonudeProvider,
  oktopodProvider,
  argusProvider,
  travellandProvider,
  grandToursProvider,
  filipTravelProvider,
];

export * from "./types";
