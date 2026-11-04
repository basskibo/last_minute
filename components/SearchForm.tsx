"use client";

import { useState } from "react";
import { LMP_COUNTRIES, LMP_POPULAR_DESTINATIONS } from "@/lib/providers/lmp-countries";
import { upcomingMonths } from "@/lib/months";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { formatGuests } from "@/lib/i18n/messages";
import { ChevronDown, Minus, Plus, Search } from "lucide-react";
import { Popover, Select } from "@radix-ui/themes";

interface SearchFormProps {
  defaultDestination?: string;
  defaultMonth?: string;
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

export default function SearchForm({
  defaultDestination = "",
  defaultMonth = "",
  defaultAdults = 2,
  defaultChildren = 0,
  variant = "bar",
  showQuickPicks = false,
}: SearchFormProps) {
  const { locale, t } = useAppPreferences();
  const [adults, setAdults] = useState(defaultAdults);
  const [children, setChildren] = useState(defaultChildren);

  const destinations = Object.keys(LMP_COUNTRIES).sort((a, b) =>
    a.localeCompare(b, locale === "en" ? "en" : "sr")
  );
  const months = upcomingMonths(8, new Date(), locale);
  const isHero = variant === "hero";
  const idPrefix = isHero ? "hero" : "bar";

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
          <Select.Root
            name="destination"
            defaultValue={defaultDestination || undefined}
            required
          >
            <Select.Trigger
              id={`${idPrefix}-destination`}
              variant="ghost"
              placeholder={t("search.destinationPlaceholder")}
              className="lm-search__trigger"
            />
            <Select.Content position="popper">
              {destinations.map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        <div className="lm-search__field lm-search__field--narrow">
          <label htmlFor={`${idPrefix}-month`} className="lm-label">
            {t("search.periodShort")}
          </label>
          <Select.Root name="month" defaultValue={defaultMonth || "any"}>
            <Select.Trigger
              id={`${idPrefix}-month`}
              variant="ghost"
              className="lm-search__trigger"
            />
            <Select.Content position="popper">
              <Select.Item value="any">{t("search.monthAny")}</Select.Item>
              {months.map((m) => (
                <Select.Item key={m.value} value={m.value}>
                  {m.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
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
                className="flex h-[22px] w-full cursor-pointer items-center justify-between gap-2 text-left text-[15px] font-medium text-ink"
              >
                <span id={`${idPrefix}-travelers-value`} className="truncate">
                  {formatGuests(adults, children, locale)}
                </span>
                <ChevronDown size={14} className="shrink-0 text-ink-subtle" aria-hidden />
              </button>
            </Popover.Trigger>
            <Popover.Content width="260px" align="end">
              <Stepper
                label={t("search.adults")}
                value={adults}
                min={1}
                max={20}
                onChange={setAdults}
              />
              <Stepper
                label={t("search.children")}
                value={children}
                min={0}
                max={10}
                onChange={setChildren}
              />
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
