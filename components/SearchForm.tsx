"use client";

import { useState } from "react";
import { LMP_POPULAR_DESTINATIONS } from "@/lib/providers/lmp-countries";
import { upcomingMonths } from "@/lib/months";
import { isValidRange } from "@/lib/dates";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { formatGuests } from "@/lib/i18n/messages";
import DestinationInput from "@/components/DestinationInput";
import { ChevronDown, Minus, Plus, Search } from "lucide-react";
import { Popover } from "@radix-ui/themes";

interface SearchFormProps {
  defaultDestination?: string;
  defaultMonth?: string;
  defaultFrom?: string;
  defaultTo?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  /** "hero" = velika traka na početnoj, "bar" = kompaktna traka na rezultatima */
  variant?: "hero" | "bar";
  /** Zadržano zbog kompatibilnosti — traka uvek nosi sopstvenu površinu. */
  embedded?: boolean;
  showQuickPicks?: boolean;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="lm-stepper">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lm-stepper__btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${label} −`}
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center text-[15px] font-semibold tabular" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="lm-stepper__btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${label} +`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function shortDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === "en" ? "en-GB" : "sr-Latn-RS", {
    day: "numeric",
    month: "short",
  });
}

export default function SearchForm({
  defaultDestination = "",
  defaultMonth = "",
  defaultFrom = "",
  defaultTo = "",
  defaultAdults = 2,
  defaultChildren = 0,
  variant = "bar",
  showQuickPicks = false,
}: SearchFormProps) {
  const { locale, t } = useAppPreferences();
  const [adults, setAdults] = useState(defaultAdults);
  const [children, setChildren] = useState(defaultChildren);

  const hasExact = isValidRange(defaultFrom, defaultTo);
  const [mode, setMode] = useState<"exact" | "flexible">(hasExact ? "exact" : "flexible");
  const [month, setMonth] = useState(defaultMonth || "any");
  const [from, setFrom] = useState(hasExact ? defaultFrom : "");
  const [to, setTo] = useState(hasExact ? defaultTo : "");

  const months = upcomingMonths(8, new Date(), locale);
  const isHero = variant === "hero";
  const idPrefix = isHero ? "hero" : "bar";

  const exactValid = mode === "exact" && isValidRange(from, to);
  const datesInvalid = mode === "exact" && Boolean(from && to) && !exactValid;

  const periodLabel = exactValid
    ? `${shortDate(from, locale)} – ${shortDate(to, locale)}`
    : month !== "any"
      ? months.find((m) => m.value === month)?.label ?? t("search.monthAny")
      : t("search.monthAny");

  return (
    <div className="w-full">
      <form
        action="/search"
        method="get"
        className={`lm-search ${isHero ? "" : "lm-search--compact"}`}
      >
        <div className="lm-search__field">
          <label htmlFor={`${idPrefix}-destination`} className="lm-label">
            {t("search.destination")}
          </label>
          <DestinationInput id={`${idPrefix}-destination`} defaultValue={defaultDestination} />
        </div>

        <div className="lm-search__field lm-search__field--narrow">
          <span id={`${idPrefix}-period-label`} className="lm-label">
            {t("search.periodShort")}
          </span>
          {exactValid ? (
            <>
              <input type="hidden" name="from" value={from} />
              <input type="hidden" name="to" value={to} />
            </>
          ) : (
            <input type="hidden" name="month" value={month} />
          )}
          <Popover.Root>
            <Popover.Trigger>
              <button
                type="button"
                aria-labelledby={`${idPrefix}-period-label`}
                aria-describedby={`${idPrefix}-period-value`}
                className="lm-search__value-btn"
              >
                <span id={`${idPrefix}-period-value`} className="truncate">
                  {periodLabel}
                </span>
                <ChevronDown size={14} className="shrink-0 text-ink-subtle" aria-hidden />
              </button>
            </Popover.Trigger>
            <Popover.Content width="380px" maxWidth="calc(100vw - 32px)" align="start">
              <div role="group" aria-label={t("search.periodShort")} className="lm-seg mb-3 w-full">
                {(["exact", "flexible"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className="lm-seg__btn flex-1"
                  >
                    {m === "exact" ? t("search.exactDates") : t("search.flexible")}
                  </button>
                ))}
              </div>

              {mode === "exact" ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="lm-label">{t("search.checkin")}</span>
                      <input
                        type="date"
                        value={from}
                        min={todayIso()}
                        onChange={(e) => {
                          setFrom(e.target.value);
                          if (to && e.target.value >= to) setTo("");
                        }}
                        className="lm-input"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="lm-label">{t("search.checkout")}</span>
                      <input
                        type="date"
                        value={to}
                        min={from || todayIso(1)}
                        onChange={(e) => setTo(e.target.value)}
                        className="lm-input"
                      />
                    </label>
                  </div>
                  {datesInvalid && (
                    <p className="text-xs text-danger" role="alert">
                      {t("search.datesInvalid")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-ink-subtle">{t("search.flexibleHint")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: "any", label: t("search.monthAny") }, ...months].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        aria-pressed={month === m.value}
                        onClick={() => setMonth(m.value)}
                        className={`lm-chip justify-center !px-1 !text-xs capitalize ${month === m.value ? "lm-chip--active" : ""}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Popover.Close>
                <button type="button" className="lm-btn lm-btn--secondary lm-btn--sm mt-3 w-full">
                  {t("search.travelersDone")}
                </button>
              </Popover.Close>
            </Popover.Content>
          </Popover.Root>
        </div>

        <div className="lm-search__field lm-search__field--narrow">
          <span id={`${idPrefix}-travelers-label`} className="lm-label">
            {t("search.travelers")}
          </span>
          <input type="hidden" name="adults" value={adults} />
          <input type="hidden" name="children" value={children} />
          <Popover.Root>
            <Popover.Trigger>
              <button
                type="button"
                aria-labelledby={`${idPrefix}-travelers-label`}
                aria-describedby={`${idPrefix}-travelers-value`}
                className="lm-search__value-btn"
              >
                <span id={`${idPrefix}-travelers-value`} className="truncate">
                  {formatGuests(adults, children, locale)}
                </span>
                <ChevronDown size={14} className="shrink-0 text-ink-subtle" aria-hidden />
              </button>
            </Popover.Trigger>
            <Popover.Content width="260px" align="end">
              <Stepper label={t("search.adults")} value={adults} min={1} max={20} onChange={setAdults} />
              <Stepper label={t("search.children")} value={children} min={0} max={10} onChange={setChildren} />
              <Popover.Close>
                <button type="button" className="lm-btn lm-btn--secondary lm-btn--sm mt-2 w-full">
                  {t("search.travelersDone")}
                </button>
              </Popover.Close>
            </Popover.Content>
          </Popover.Root>
        </div>

        <button
          type="submit"
          className={`lm-btn lm-btn--primary lm-btn--pill ${isHero ? "lm-btn--lg" : ""}`}
        >
          <Search size={isHero ? 18 : 16} aria-hidden />
          {isHero ? t("search.submitHero") : t("search.submit")}
        </button>
      </form>

      {showQuickPicks && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="lm-label mr-1">{t("search.quick")}</span>
          {LMP_POPULAR_DESTINATIONS.map((d) => (
            <a
              key={d}
              href={`/search?destination=${encodeURIComponent(d)}&adults=${adults}&children=${children}`}
              className="lm-chip"
            >
              {d}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
