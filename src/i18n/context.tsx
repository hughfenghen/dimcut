import {
  createContext,
  createSignal,
  useContext,
  type JSX,
  type Component,
} from "solid-js";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

type Locale = "en" | "zh";

const STORAGE_KEY = "dimcut-locale";

const messages: Record<Locale, Record<string, string>> = { en, zh };

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "zh") return stored;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

interface I18nValue {
  locale: () => Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue>();

export const I18nProvider: Component<{ children: JSX.Element }> = (props) => {
  const [locale, setLocale] = createSignal<Locale>(detectLocale());

  const changeLocale = (l: Locale) => {
    setLocale(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string): string => {
    return messages[locale()][key] ?? messages.en[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {props.children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
