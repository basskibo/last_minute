"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { suggestDestinations, type DestinationEntry } from "@/lib/destinations";
import { useAppPreferences } from "@/components/providers/AppProviders";

/**
 * Slobodan unos destinacije (država, grad, ostrvo, regija) sa predlozima.
 * Nepoznata mesta su dozvoljena — server ih razrešava (vidi lib/search.ts).
 * ARIA combobox obrazac: strelice biraju predlog, Enter potvrđuje, Esc zatvara.
 */
export default function DestinationInput({
  id,
  defaultValue = "",
}: {
  id: string;
  defaultValue?: string;
}) {
  const { t } = useAppPreferences();
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => suggestDestinations(value, 8), [value]);
  const showList = open && suggestions.length > 0;

  function choose(entry: DestinationEntry) {
    setValue(entry.name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name="destination"
        required
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder={t("search.destinationPlaceholder")}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="lm-search__input"
      />
      {showList && (
        <ul id={listId} role="listbox" className="lm-suggest">
          {suggestions.map((s, i) => (
            <li
              key={`${s.kind}-${s.name}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className="lm-suggest__item"
            >
              <MapPin size={15} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{s.name}</span>
              <span className="shrink-0 text-xs text-ink-subtle">
                {s.kind === "country" ? t("search.countrySuggestion") : s.country}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
