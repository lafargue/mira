import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { STRINGS, type Messages } from "@/lib/i18n/strings";
import {
  applyPrefsToDocument,
  loadPrefs,
  savePrefs,
  type Locale,
  type Prefs,
  type Theme,
} from "@/lib/prefs";

type PrefsContextValue = {
  theme: Theme;
  locale: Locale;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => {
    applyPrefsToDocument(prefs);
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (prefs.theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyPrefsToDocument(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  const setTheme = useCallback((theme: Theme) => {
    setPrefs((p) => ({ ...p, theme }));
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    setPrefs((p) => ({ ...p, locale }));
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      theme: prefs.theme,
      locale: prefs.locale,
      setTheme,
      setLocale,
      t: STRINGS[prefs.locale],
    }),
    [prefs, setTheme, setLocale],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    return {
      theme: "system",
      locale: "es",
      setTheme: () => undefined,
      setLocale: () => undefined,
      t: STRINGS.es,
    };
  }
  return ctx;
}
