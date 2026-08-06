import type { Provider } from "./types";
import { lastMinutePonudeProvider } from "./lastminuteponude";
import { oktopodProvider } from "./oktopod";
import { bookingProvider } from "./booking";
import { airbnbProvider } from "./airbnb";

export const providers: Provider[] = [
  lastMinutePonudeProvider,
  oktopodProvider,
  bookingProvider,
  airbnbProvider,
];

export * from "./types";
