"use client";

import SearchForm from "@/components/SearchForm";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { Flex } from "@radix-ui/themes";

interface SearchEmptyPromptProps {
  adults: number;
  children: number;
}

export default function SearchEmptyPrompt({ adults, children }: SearchEmptyPromptProps) {
  const { t } = useAppPreferences();

  return (
    <Flex direction="column" align="center" className="flex-1 px-4 py-16" gap="8">
      <p className="text-theme-muted">{t("search.emptyPrompt")}</p>
      <SearchForm defaultAdults={adults} defaultChildren={children} showQuickPicks />
    </Flex>
  );
}
