import { Locale, Dictionary } from "./types";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

export * from "./types";

export const dictionaries: Record<Locale, Dictionary> = {
  ar,
  en,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.ar;
}
