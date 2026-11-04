"use client";

import { useEffect, useState } from "react";
import { ExternalLink, SlidersHorizontal, X } from "lucide-react";
import ProviderFilter from "@/components/ProviderFilter";
import { useAppPreferences } from "@/components/providers/AppProviders";
import type { MessageKey } from "@/lib/i18n/messages";
import type { ProviderStatus } from "@/lib/search";
import type { ExternalSource } from "@/lib/external-sources";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  type BoardType,
  type NightsBucket,
  type OfferFilters,
} from "@/lib/filters";

type Facets = {
  transport: Map<string, number>;
  accommodation: Map<string, number>;
  board: Map<BoardType, number>;
  nights: Map<NightsBucket, number>;
  discounted: number;
  rated: number;
  priceMin: number;
  priceMax: number;
};

const TRANSPORT: { value: string; key: MessageKey }[] = [
  { value: "avion", key: "offer.transport.avion" },
  { value: "autobus", key: "offer.transport.autobus" },
  { value: "sopstveni", key: "offer.transport.sopstveni" },
];
const ACCOMMODATION: { value: string; key: MessageKey }[] = [
  { value: "hotel", key: "offer.accommodation.hotel" },
  { value: "apartman", key: "offer.accommodation.apartman" },
];
const BOARD: { value: BoardType; key: MessageKey }[] = [
  { value: "ai", key: "board.ai" },
  { value: "fb", key: "board.fb" },
  { value: "hb", key: "board.hb" },
  { value: "bb", key: "board.bb" },
  { value: "ro", key: "board.ro" },
];
const NIGHTS: { value: NightsBucket; key: MessageKey }[] = [
  { value: "short", key: "nights.short" },
  { value: "week", key: "nights.week" },
  { value: "long", key: "nights.long" },
];
const RATINGS = [7, 8, 9];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ChipGroup<T extends string>({
  title,
  options,
  selected,
  counts,
  onChange,
}: {
  title: string;
  options: { value: T; key: MessageKey }[];
  selected: T[];
  counts: Map<T, number>;
  onChange: (next: T[]) => void;
}) {
  const { t } = useAppPreferences();
  const visible = options.filter((o) => (counts.get(o.value) ?? 0) > 0 || selected.includes(o.value));
  if (visible.length === 0) return null;
  return (
    <fieldset className="lm-filter">
      <legend className="lm-filter__title">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggle(selected, o.value))}
              className={`lm-chip !h-8 !px-3 ${on ? "lm-chip--active" : ""}`}
            >
              {t(o.key)}
              <span className="font-mono text-[11px] text-ink-subtle">{counts.get(o.value) ?? 0}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function FiltersPanel({
  filters,
  onChange,
  facets,
  providerStatus,
  externalLinks,
}: {
  filters: OfferFilters;
  onChange: (next: OfferFilters) => void;
  facets: Facets;
  providerStatus: ProviderStatus[];
  externalLinks: ExternalSource[];
}) {
  const { t } = useAppPreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = activeFilterCount(filters);

  // Tekst i cene se kucaju — u URL ih upisujemo kad korisnik zastane.
  const [q, setQ] = useState(filters.q);
  const [pmin, setPmin] = useState(filters.priceMin?.toString() ?? "");
  const [pmax, setPmax] = useState(filters.priceMax?.toString() ?? "");
  useEffect(() => {
    const id = setTimeout(() => {
      const priceMin = pmin === "" ? undefined : Math.max(0, Number(pmin)) || undefined;
      const priceMax = pmax === "" ? undefined : Math.max(0, Number(pmax)) || undefined;
      if (q !== filters.q || priceMin !== filters.priceMin || priceMax !== filters.priceMax) {
        onChange({ ...filters, q, priceMin, priceMax });
      }
    }, 350);
    return () => clearTimeout(id);
  }, [q, pmin, pmax, filters, onChange]);

  function reset() {
    setQ("");
    setPmin("");
    setPmax("");
    onChange(EMPTY_FILTERS);
  }

  return (
    <aside className="lm-panel">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-1">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink lg:pointer-events-none"
        >
          <SlidersHorizontal size={16} className="text-primary" aria-hidden />
          {t("filters.title")}
          {active > 0 && <span className="lm-badge lm-badge--brand">{active}</span>}
        </button>
        {active > 0 && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <X size={13} aria-hidden />
            {t("filters.reset")}
          </button>
        )}
      </div>

      <div className={`${mobileOpen ? "flex" : "hidden"} flex-col lg:flex`}>
        <div className="lm-filter">
          <label htmlFor="filter-q" className="lm-filter__title">
            {t("filters.search")}
          </label>
          <input
            id="filter-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="lm-input"
          />
        </div>

        <fieldset className="lm-filter">
          <legend className="lm-filter__title">{t("filters.price")}</legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={pmin}
              onChange={(e) => setPmin(e.target.value)}
              placeholder={`${t("filters.priceMin")} ${facets.priceMin || ""}`}
              aria-label={`${t("filters.price")} — ${t("filters.priceMin")}`}
              className="lm-input"
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={pmax}
              onChange={(e) => setPmax(e.target.value)}
              placeholder={`${t("filters.priceMax")} ${facets.priceMax || ""}`}
              aria-label={`${t("filters.price")} — ${t("filters.priceMax")}`}
              className="lm-input"
            />
          </div>
          {facets.discounted > 0 && (
            <label className="lm-check cursor-pointer">
              <input
                type="checkbox"
                checked={filters.discountOnly}
                onChange={(e) => onChange({ ...filters, discountOnly: e.target.checked })}
                className="h-[18px] w-[18px] accent-[var(--primary)]"
              />
              <span>{t("filters.discountOnly")}</span>
              <span className="lm-check__count tabular">{facets.discounted}</span>
            </label>
          )}
        </fieldset>

        <ChipGroup
          title={t("filters.transport")}
          options={TRANSPORT}
          selected={filters.transport}
          counts={facets.transport}
          onChange={(transport) => onChange({ ...filters, transport })}
        />
        <ChipGroup
          title={t("filters.accommodation")}
          options={ACCOMMODATION}
          selected={filters.accommodation}
          counts={facets.accommodation}
          onChange={(accommodation) => onChange({ ...filters, accommodation })}
        />
        <ChipGroup
          title={t("filters.board")}
          options={BOARD}
          selected={filters.board}
          counts={facets.board}
          onChange={(board) => onChange({ ...filters, board })}
        />
        <ChipGroup
          title={t("filters.nights")}
          options={NIGHTS}
          selected={filters.nights}
          counts={facets.nights}
          onChange={(nights) => onChange({ ...filters, nights })}
        />

        {facets.rated > 0 && (
          <fieldset className="lm-filter">
            <legend className="lm-filter__title">{t("filters.rating")}</legend>
            <div className="lm-seg w-full">
              {[undefined, ...RATINGS].map((r) => (
                <button
                  key={r ?? "any"}
                  type="button"
                  aria-pressed={filters.minRating === r}
                  onClick={() => onChange({ ...filters, minRating: r })}
                  className="lm-seg__btn flex-1"
                >
                  {r == null ? t("filters.ratingAny") : `${r}+`}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="lm-filter">
          <ProviderFilter
            providerStatus={providerStatus}
            selected={filters.providers}
            onChange={(providers) => onChange({ ...filters, providers })}
          />
        </div>

        {externalLinks.length > 0 && (
          <div className="lm-filter border-b-0">
            <h3 className="lm-filter__title">{t("external.title")}</h3>
            <p className="text-xs text-ink-subtle">{t("external.hint")}</p>
            <div className="flex flex-wrap gap-1.5">
              {externalLinks.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lm-chip !h-8 !px-3"
                >
                  {l.label}
                  <ExternalLink size={12} aria-hidden />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
