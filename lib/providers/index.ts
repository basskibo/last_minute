import type { Provider } from "./types";
import { lastMinutePonudeProvider } from "./lastminuteponude";
import { oktopodProvider } from "./oktopod";
import { argusProvider } from "./argus";
import { travellandProvider } from "./travelland";
import { grandToursProvider } from "./grandtours";
import { filipTravelProvider } from "./filiptravel";
import { bookingProvider } from "./booking";
import { airbnbProvider } from "./airbnb";

export const providers: Provider[] = [
  lastMinutePonudeProvider,
  oktopodProvider,
  argusProvider,
  travellandProvider,
  grandToursProvider,
  filipTravelProvider,
  bookingProvider,
  airbnbProvider,
];

export * from "./types";
