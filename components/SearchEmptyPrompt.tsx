"use client";

import SearchForm from "@/components/SearchForm";
import { useAppPreferences } from "@/components/providers/AppProviders";

interface SearchEmptyPromptProps {
  adults: number;
  children: number;
}

export default function SearchEmptyPrompt({ adults, children }: SearchEmptyPromptProps) {
  const { t } = useAppPreferences();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
      <p className="font-display text-2xl font-bold tracking-tight text-ink">
        {t("search.emptyPrompt")}
      </p>
      <SearchForm variant="hero" defaultAdults={adults} defaultChildren={children} showQuickPicks />
    </main>
  );
}
