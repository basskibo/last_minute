import { pickStayDates } from "./dates";

/**
 * Dodatni izvori koje NE skrejpujemo (jaka anti-bot zaštita ili nema
 * stabilne strukture), ali do kojih vodimo direktno, sa već popunjenom
 * destinacijom, datumima i brojem gostiju — korisnik jednim klikom
 * proverava cene i tamo.
 */
export interface ExternalSource {
  id: string;
  label: string;
  url: string;
}

export function externalSources(opts: {
  query: string;
  month?: string;
  adults: number;
  children: number;
}): ExternalSource[] {
  const { checkin, checkout, nights } = pickStayDates(opts.month);
  const q = encodeURIComponent(opts.query);
  const guests = opts.adults + opts.children;

  return [
    {
      id: "expedia",
      label: "Expedia",
      url: `https://www.expedia.com/Hotel-Search?destination=${q}&startDate=${checkin}&endDate=${checkout}&adults=${opts.adults}`,
    },
    {
      id: "hotels",
      label: "Hotels.com",
      url: `https://www.hotels.com/Hotel-Search?destination=${q}&startDate=${checkin}&endDate=${checkout}&adults=${opts.adults}`,
    },
    {
      id: "vrbo",
      label: "Vrbo",
      url: `https://www.vrbo.com/search?destination=${q}&startDate=${checkin}&endDate=${checkout}&adults=${opts.adults}`,
    },
    {
      id: "agoda",
      label: "Agoda",
      url: `https://www.agoda.com/search?textToSearch=${q}&checkIn=${checkin}&los=${nights}&adults=${opts.adults}&children=${opts.children}&rooms=1`,
    },
    {
      id: "kayak",
      label: "Kayak",
      url: `https://www.kayak.com/hotels/${encodeURIComponent(opts.query.replace(/\s+/g, "-"))}/${checkin}/${checkout}/${guests}adults`,
    },
    {
      id: "google",
      label: "Google Hotels",
      url: `https://www.google.com/travel/search?q=${encodeURIComponent(`hotels in ${opts.query}`)}`,
    },
  ];
}
