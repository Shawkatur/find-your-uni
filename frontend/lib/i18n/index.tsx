"use client";

import { createContext, useContext, useCallback, useState, useEffect } from "react";
import en from "./en.json";
import bn from "./bn.json";

const translations = { en, bn } as const;
type Locale = keyof typeof translations;
type TranslationKeys = typeof en;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function useTranslation() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && stored in translations) setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string): string => {
      const parts = key.split(".");
      let result: any = translations[locale];
      for (const part of parts) {
        result = result?.[part];
      }
      if (typeof result === "string") return result;
      // Fallback to English
      let fallback: any = translations.en;
      for (const part of parts) {
        fallback = fallback?.[part];
      }
      return typeof fallback === "string" ? fallback : key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export type { Locale };
