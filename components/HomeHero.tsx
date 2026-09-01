"use client";

import SearchForm from "@/components/SearchForm";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { Sparkles } from "lucide-react";

export default function HomeHero() {
  const { t } = useAppPreferences();

  return (
    <>
      <div className="flex max-w-2xl flex-col gap-3 text-center">
        <span className="inline-flex items-center gap-1.5 self-center rounded-full border border-[var(--primary-ring)] bg-[var(--primary-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm">
          <Sparkles size={13} />
          {t("home.badge")}
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-theme sm:text-5xl">
          {t("home.titleStart")}{" "}
          <span className="text-gradient-brand">{t("home.titleHighlight")}</span>
        </h1>
        <p className="text-base text-theme-muted sm:text-lg">{t("home.subtitle")}</p>
      </div>

      <SearchForm variant="hero" />

      <p className="max-w-xl text-center text-xs text-theme-subtle">{t("home.disclaimer")}</p>
    </>
  );
}
