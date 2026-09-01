"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Theme } from "@radix-ui/themes";
import {
  interpolate,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/messages";

export type ThemeMode = "light" | "dark";

const STORAGE_THEME = "lmf-theme";
const STORAGE_LOCALE = "lmf-locale";

interface AppPreferences {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const AppPreferencesContext = createContext<AppPreferences | null>(null);

function readInitialTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function readInitialLocale(): Locale {
  if (typeof document === "undefined") return "sr";
  return document.documentElement.getAttribute("data-locale") === "en"
    ? "en"
    : "sr";
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale === "sr" ? "sr" : "en";
    document.documentElement.setAttribute("data-locale", locale);
    try {
      localStorage.setItem(STORAGE_LOCALE, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const text = translate(locale, key);
      return vars ? interpolate(text, vars) : text;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ theme, setTheme, locale, setLocale, t }),
    [theme, setTheme, locale, setLocale, t]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      <Theme
        appearance={theme}
        accentColor="gray"
        grayColor="slate"
        radius="large"
        panelBackground="solid"
        className="min-h-full flex flex-col flex-1"
      >
        {children}
      </Theme>
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferences {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppProviders");
  }
  return ctx;
}
