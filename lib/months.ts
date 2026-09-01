import type { Locale } from "@/lib/i18n/messages";

const MONTH_NAMES: Record<Locale, string[]> = {
  sr: [
    "Januar",
    "Februar",
    "Mart",
    "April",
    "Maj",
    "Jun",
    "Jul",
    "Avgust",
    "Septembar",
    "Oktobar",
    "Novembar",
    "Decembar",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

export interface MonthOption {
  value: string;
  label: string;
}

export function upcomingMonths(
  count = 8,
  from: Date = new Date(),
  locale: Locale = "sr"
): MonthOption[] {
  const names = MONTH_NAMES[locale];
  const options: MonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${names[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value, label });
  }
  return options;
}

export function monthName(value: string | undefined, locale: Locale = "sr"): string | null {
  if (!value) return null;
  const [, m] = value.split("-");
  const idx = parseInt(m, 10) - 1;
  return MONTH_NAMES[locale][idx] ?? null;
}

/** @deprecated use monthName */
export function monthNameSr(value: string | undefined): string | null {
  return monthName(value, "sr");
}
