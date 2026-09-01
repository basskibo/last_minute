"use client";

import Link from "next/link";
import { Compass, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useAppPreferences, type ThemeMode } from "@/components/providers/AppProviders";
import type { Locale } from "@/lib/i18n/messages";

function ToggleGroup<T extends string>({
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
    <div
      role="group"
      aria-label={ariaLabel}
      className="header-toggle-group"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`header-toggle-btn ${value === opt.value ? "header-toggle-btn-active" : ""}`}
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
    <header className="sticky top-0 z-50 border-b border-[var(--border-muted)] bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 text-theme transition hover:text-primary-hover"
        >
          <span className="logo-brand shrink-0">
            <Compass size={16} className="text-[var(--primary-fg)]" strokeWidth={2.25} />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {t("header.siteName")}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ToggleGroup<ThemeMode>
            value={theme}
            onChange={setTheme}
            ariaLabel={t("header.themeDark")}
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

          <ToggleGroup<Locale>
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
