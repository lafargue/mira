import { ArrowLeft, Monitor, Moon, Sun } from "lucide-react";
import { usePrefs } from "@/lib/prefs-context";
import { LOCALES, THEMES, type Locale, type Theme } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const THEME_ICON = {
  system: Monitor,
  dark: Moon,
  light: Sun,
} as const;

export function Settings({ onClose }: { onClose: () => void }) {
  const { t, theme, locale, setTheme, setLocale } = usePrefs();

  const themeLabel: Record<Theme, string> = {
    system: t.themeSystem,
    dark: t.themeDark,
    light: t.themeLight,
  };

  const localeLabel: Record<Locale, string> = {
    es: t.langEs,
    en: t.langEn,
    fr: t.langFr,
    de: t.langDe,
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label={t.back}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <h2 className="font-display text-2xl tracking-tight">{t.settings}</h2>
      </header>

      <section className="mt-8" aria-labelledby="mira-appearance">
        <h3 id="mira-appearance" className="font-medium text-fg">
          {t.appearance}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.appearanceHint}</p>
        <div role="radiogroup" aria-labelledby="mira-appearance" className="mt-4 grid grid-cols-3 gap-2">
          {THEMES.map((option) => {
            const Icon = THEME_ICON[option];
            const on = theme === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTheme(option)}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm transition-colors duration-150",
                  on
                    ? "border-fg bg-surface-2 text-fg"
                    : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                {themeLabel[option]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="mira-language">
        <h3 id="mira-language" className="font-medium text-fg">
          {t.language}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.languageHint}</p>
        <div role="radiogroup" aria-labelledby="mira-language" className="mt-4 flex flex-col gap-2">
          {LOCALES.map((option) => {
            const on = locale === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setLocale(option)}
                className={cn(
                  "flex min-h-12 items-center justify-between rounded-2xl border px-4 text-sm transition-colors duration-150",
                  on
                    ? "border-fg bg-surface-2 text-fg"
                    : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                <span>{localeLabel[option]}</span>
                <span className="text-xs uppercase tracking-wider text-subtle">{option}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
