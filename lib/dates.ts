function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Booking/Airbnb zahtevaju tačan check-in/check-out, a naš search prima
 * samo fleksibilan mesec (ili ništa). Bira razuman 3-noćni prozor: sredina
 * izabranog meseca, ili ~2 nedelje unapred ako mesec nije zadat (tipično
 * za last-minute pretragu).
 */
export function pickStayDates(
  month?: string,
  exact?: { checkin?: string; checkout?: string }
): {
  checkin: string;
  checkout: string;
  nights: number;
} {
  if (exact?.checkin && exact.checkout && isValidRange(exact.checkin, exact.checkout)) {
    const nightsExact = Math.round(
      (Date.parse(exact.checkout) - Date.parse(exact.checkin)) / 86_400_000
    );
    return { checkin: exact.checkin, checkout: exact.checkout, nights: nightsExact };
  }
  const now = new Date();
  let start: Date;

  if (month) {
    const [y, m] = month.split("-").map(Number);
    start = new Date(y, (m || 1) - 1, 15);
    if (start < now) {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
    }
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  }

  const nights = 3;
  const end = new Date(start);
  end.setDate(end.getDate() + nights);

  return { checkin: toIso(start), checkout: toIso(end), nights };
}

export function formatDateRange(checkinIso: string, checkoutIso: string): string {
  const [, cm, cd] = checkinIso.split("-");
  const [ey, em, ed] = checkoutIso.split("-");
  return `${cd}.${cm} - ${ed}.${em}.${ey}.`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Ispravan opseg: oba ISO datuma, povratak posle polaska, najviše 60 noći. */
export function isValidRange(checkin?: string, checkout?: string): boolean {
  if (!checkin || !checkout || !ISO_DATE.test(checkin) || !ISO_DATE.test(checkout)) return false;
  const a = Date.parse(checkin);
  const b = Date.parse(checkout);
  return Number.isFinite(a) && Number.isFinite(b) && b > a && b - a <= 60 * 86_400_000;
}

/** "2026-08-14" → "2026-08" (za rangiranje agencijskih ponuda po mesecu). */
export function monthOf(isoDate?: string): string | undefined {
  return isoDate && ISO_DATE.test(isoDate) ? isoDate.slice(0, 7) : undefined;
}
