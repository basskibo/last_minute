const MONTH_NAMES_SR = [
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
];

export interface MonthOption {
  value: string;
  label: string;
}

export function upcomingMonths(count = 8, from: Date = new Date()): MonthOption[] {
  const options: MonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES_SR[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value, label });
  }
  return options;
}

export function monthNameSr(value: string | undefined): string | null {
  if (!value) return null;
  const [, m] = value.split("-");
  const idx = parseInt(m, 10) - 1;
  return MONTH_NAMES_SR[idx] ?? null;
}
