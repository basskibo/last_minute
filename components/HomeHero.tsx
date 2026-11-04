"use client";

import SearchForm from "@/components/SearchForm";
import { useAppPreferences } from "@/components/providers/AppProviders";

export default function HomeHero() {
  const { t } = useAppPreferences();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-5">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-deal">
          <span aria-hidden className="h-2 w-2 rounded-full bg-deal" />
          {t("home.badge")}
        </span>
        <h1 className="font-display text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[64px] lg:text-[72px]">
          {t("home.titleStart")} <span className="text-primary">{t("home.titleHighlight")}</span>
        </h1>
        <p className="max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
          {t("home.subtitle")}
        </p>
      </div>

      <SearchForm variant="hero" showQuickPicks />

      <p className="max-w-xl text-xs leading-5 text-ink-subtle">{t("home.disclaimer")}</p>
    </section>
  );
}
