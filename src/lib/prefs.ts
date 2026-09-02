export const PREFS_KEY = "mira-prefs-v1";

export const THEMES = ["system", "dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const LOCALES = ["es", "en", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export type Prefs = {
  theme: Theme;
  locale: Locale;
};

const DEFAULTS: Prefs = { theme: "system", locale: "es" };

function canStore(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function loadPrefs(): Prefs {
  if (!canStore()) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULTS.theme,
      locale: isLocale(parsed.locale) ? parsed.locale : DEFAULTS.locale,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePrefs(prefs: Prefs): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / quota */
  }
}

export function resolvedTheme(theme: Theme): "dark" | "light" {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyPrefsToDocument(prefs: Prefs): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", prefs.theme);
  root.setAttribute("lang", prefs.locale);
  const color = resolvedTheme(prefs.theme) === "light" ? "#f4f3ef" : "#0c0d10";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", color);
}

export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"{}");var t=p.theme==="light"||p.theme==="dark"||p.theme==="system"?p.theme:"system";var l=p.locale==="en"||p.locale==="fr"||p.locale==="de"||p.locale==="es"?p.locale:"es";document.documentElement.setAttribute("data-theme",t);document.documentElement.setAttribute("lang",l);}catch(e){document.documentElement.setAttribute("data-theme","system");}})();`;
