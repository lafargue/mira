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

export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULTS.locale;
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of list) {
    if (!raw) continue;
    const code = raw.slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULTS.locale;
}

export function loadPrefs(): Prefs {
  const fallback: Prefs = { theme: DEFAULTS.theme, locale: detectLocale() };
  if (!canStore()) return fallback;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : fallback.theme,
      locale: isLocale(parsed.locale) ? parsed.locale : fallback.locale,
    };
  } catch {
    return fallback;
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

export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"{}");var t=p.theme==="light"||p.theme==="dark"||p.theme==="system"?p.theme:"system";var l=["es","en","fr","de"].indexOf(p.locale)>=0?p.locale:(navigator.language||"es").slice(0,2);if(["es","en","fr","de"].indexOf(l)<0)l="es";var r=document.documentElement;r.setAttribute("data-theme",t);r.setAttribute("lang",l);var light=t==="light"||(t==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",light?"#f4f3ef":"#0c0d10");}catch(e){document.documentElement.setAttribute("data-theme","system");}})();`;
