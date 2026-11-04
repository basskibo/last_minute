"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useAppPreferences, type ThemeMode } from "@/components/providers/AppProviders";
import type { Locale } from "@/lib/i18n/messages";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="lm-seg">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          aria-label={opt.title}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="lm-seg__btn"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SiteHeader() {
  const { theme, setTheme, locale, setLocale, t } = useAppPreferences();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display inline-flex min-w-0 items-baseline gap-1.5 text-base font-bold tracking-tight text-ink min-[400px]:text-lg sm:text-xl"
        >
          <span className="truncate lowercase">{t("header.siteName")}</span>
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-deal"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Segmented<ThemeMode>
            value={theme}
            onChange={setTheme}
            ariaLabel={`${t("header.themeLight")} / ${t("header.themeDark")}`}
            options={[
              {
                value: "light",
                label: <Sun size={15} strokeWidth={2} aria-hidden />,
                title: t("header.themeLight"),
              },
              {
                value: "dark",
                label: <Moon size={15} strokeWidth={2} aria-hidden />,
                title: t("header.themeDark"),
              },
            ]}
          />

          <Segmented<Locale>
            value={locale}
            onChange={setLocale}
            ariaLabel={t("header.language")}
            options={[
              { value: "sr", label: "RS" },
              { value: "en", label: "EN" },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
