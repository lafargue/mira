import { ArrowLeft, Check, Monitor, Moon, Sun, Wand2 } from "lucide-react";
import { useRef } from "react";
import { CreditShop } from "@/components/game/credit-shop";
import { HandleForm } from "@/components/game/handle-form";
import { usePrefs } from "@/lib/prefs-context";
import { LOCALES, THEMES, type Locale, type Theme } from "@/lib/prefs";
import type { BuyResult, PackId } from "@/lib/game/packs";
import type { SetHandleResult } from "@/lib/game/profile";
import { TIP_COST } from "@/lib/game/wallet";
import { cn } from "@/lib/utils";

const THEME_ICON = {
  system: Monitor,
  dark: Moon,
  light: Sun,
} as const;

const THEME_SWATCH: Record<Theme, { bg: string; accent: string }> = {
  system: { bg: "#8a8b90", accent: "#16171c" },
  dark: { bg: "#0c0d10", accent: "#2aa78e" },
  light: { bg: "#f4f3ef", accent: "#e25c6a" },
};

export function Settings({
  onClose,
  credits,
  signedIn,
  busy,
  onBuy,
  handle,
  onCheckHandle,
  onSaveHandle,
}: {
  onClose: () => void;
  credits: number;
  signedIn: boolean;
  busy: boolean;
  onBuy: (packId: PackId) => Promise<BuyResult>;
  handle: string | null;
  onCheckHandle: (value: string) => Promise<SetHandleResult>;
  onSaveHandle: (value: string) => Promise<SetHandleResult>;
}) {
  const { t, theme, locale, setTheme, setLocale } = usePrefs();
  const themeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const localeRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  const move = <T extends string>(
    list: readonly T[],
    current: T,
    key: string,
    set: (v: T) => void,
    refs: Array<HTMLButtonElement | null>,
  ) => {
    const i = list.indexOf(current);
    if (i < 0) return;
    let next = i;
    if (key === "ArrowRight" || key === "ArrowDown") next = (i + 1) % list.length;
    else if (key === "ArrowLeft" || key === "ArrowUp") next = (i - 1 + list.length) % list.length;
    else if (key === "Home") next = 0;
    else if (key === "End") next = list.length - 1;
    else return;
    set(list[next]);
    requestAnimationFrame(() => refs[next]?.focus());
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
          aria-label={t.back}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <h2 className="font-display text-2xl tracking-tight">{t.settings}</h2>
      </header>

      {signedIn ? (
        <section className="mt-8" aria-labelledby="mira-handle">
          <h3 id="mira-handle" className="font-medium text-fg">
            {t.handleChange}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t.handleChangeHint}</p>
          {handle ? (
            <p className="mt-3 font-display text-2xl tracking-tight text-fg">@{handle}</p>
          ) : null}
          <HandleForm
            initial={handle ?? ""}
            current={handle}
            submitLabel={t.handleSave}
            inputId="mira-settings-handle"
            onCheck={onCheckHandle}
            onSave={onSaveHandle}
          />
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="mira-wallet">
        <h3 id="mira-wallet" className="font-medium text-fg">
          {t.credits}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.helpedHint}</p>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Wand2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {t.tip} · {TIP_COST}
          </span>
          <span className="font-display text-2xl tabular-nums text-fg">{credits}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-subtle">{t.grantHint}</p>
      </section>

      <section className="mt-8" aria-labelledby="mira-shop">
        <h3 id="mira-shop" className="font-medium text-fg">
          {t.shopTitle}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.shopHint}</p>
        <CreditShop signedIn={signedIn} busy={busy} onBuy={onBuy} />
      </section>

      <section className="mt-8" aria-labelledby="mira-appearance">
        <h3 id="mira-appearance" className="font-medium text-fg">
          {t.appearance}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.appearanceHint}</p>
        <div
          role="radiogroup"
          aria-labelledby="mira-appearance"
          className="mt-4 grid grid-cols-3 gap-2"
          onKeyDown={(e) => move(THEMES, theme, e.key, setTheme, themeRefs.current)}
        >
          {THEMES.map((option, i) => {
            const Icon = THEME_ICON[option];
            const on = theme === option;
            const swatch = THEME_SWATCH[option];
            return (
              <button
                key={option}
                ref={(el) => {
                  themeRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setTheme(option)}
                className={cn(
                  "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50",
                  on ? "border-fg bg-surface-2 text-fg" : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                <span
                  className="flex h-7 w-11 items-center justify-center overflow-hidden rounded-md border border-border/80"
                  style={{ background: swatch.bg }}
                  aria-hidden="true"
                >
                  <span className="size-2.5 rounded-full" style={{ background: swatch.accent }} />
                </span>
                <span className="flex items-center gap-1">
                  <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {themeLabel[option]}
                </span>
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
        <div
          role="radiogroup"
          aria-labelledby="mira-language"
          className="mt-4 flex flex-col gap-2"
          onKeyDown={(e) => move(LOCALES, locale, e.key, setLocale, localeRefs.current)}
        >
          {LOCALES.map((option, i) => {
            const on = locale === option;
            return (
              <button
                key={option}
                ref={(el) => {
                  localeRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setLocale(option)}
                className={cn(
                  "flex min-h-12 items-center justify-between rounded-2xl border px-4 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50",
                  on ? "border-fg bg-surface-2 text-fg" : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                <span>{localeLabel[option]}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-subtle">{option}</span>
                  {on ? <Check className="size-4 text-fg" strokeWidth={2} aria-hidden="true" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
