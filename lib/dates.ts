function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Booking/Airbnb zahtevaju tačan check-in/check-out, a naš search prima
 * samo fleksibilan mesec (ili ništa). Bira razuman 3-noćni prozor: sredina
 * izabranog meseca, ili ~2 nedelje unapred ako mesec nije zadat (tipično
 * za last-minute pretragu).
 */
export function pickStayDates(month?: string): {
  checkin: string;
  checkout: string;
  nights: number;
} {
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
