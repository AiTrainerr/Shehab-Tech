"use client"

import * as React from "react";
import { Locale, Direction, Dictionary } from "./types";
import { getDictionary } from "./index";
import { setLocaleAction } from "@/app/actions/locale";

interface LanguageContextType {
  locale: Locale;
  dir: Direction;
  dict: Dictionary;
  setLocale: (locale: Locale) => Promise<void>;
  toggleLocale: () => Promise<void>;
}

const LanguageContext = React.createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  initialLocale = "ar",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const dir: Direction = locale === "ar" ? "rtl" : "ltr";
  const dict = React.useMemo(() => getDictionary(locale), [locale]);

  const setLocale = React.useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    const newDir: Direction = newLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newDir;
    try {
      localStorage.setItem("app_locale", newLocale);
    } catch (e) {}
    await setLocaleAction(newLocale);
  }, []);

  const toggleLocale = React.useCallback(async () => {
    const nextLocale: Locale = locale === "ar" ? "en" : "ar";
    await setLocale(nextLocale);
  }, [locale, setLocale]);

  // Synchronize on mount if client has stored preference
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("app_locale") as Locale | null;
      if (stored && (stored === "ar" || stored === "en") && stored !== locale) {
        setLocaleState(stored);
        document.documentElement.lang = stored;
        document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
      }
    } catch (e) {}
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, dir, dict, setLocale, toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
