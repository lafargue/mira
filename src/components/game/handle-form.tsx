import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { foldHandle, parseHandle } from "@/lib/game/handle";
import type { SetHandleResult } from "@/lib/game/profile";
import { usePrefs } from "@/lib/prefs-context";
import { cn } from "@/lib/utils";

export function HandleForm({
  initial = "",
  current = null,
  submitLabel,
  fieldLabel,
  autoFocus = false,
  onCheck,
  onSave,
}: {
  initial?: string;
  current?: string | null;
  submitLabel: string;
  fieldLabel?: string;
  autoFocus?: boolean;
  onCheck: (value: string) => Promise<SetHandleResult>;
  onSave: (value: string) => Promise<SetHandleResult>;
}) {
  const { t } = usePrefs();
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<SetHandleResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const gen = useRef(0);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus(null);
      setChecking(false);
      return;
    }
    if (current && foldHandle(trimmed) === foldHandle(current) && parseHandle(current).ok) {
      setStatus({ ok: true, handle: current, unchanged: true });
      setChecking(false);
      return;
    }
    const id = ++gen.current;
    setChecking(true);
    const timer = window.setTimeout(() => {
      void onCheck(trimmed)
        .then((res) => {
          if (gen.current !== id) return;
          setStatus(res);
          setChecking(false);
        })
        .catch(() => {
          if (gen.current !== id) return;
          setChecking(false);
        });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [value, current, onCheck]);

  const canSave = Boolean(status?.ok && !status.unchanged) && !saving && !checking;
  const reason = status && !status.ok ? status.reason : null;
  const suggestions = status && !status.ok ? status.suggestions : [];

  const message = !value.trim()
    ? t.handleHint
    : checking
      ? t.handleChecking
      : reason === "taken"
        ? t.handleTaken
        : reason === "reserved"
          ? t.handleReserved
          : reason === "invalid"
            ? t.handleInvalid
            : status?.ok && status.unchanged
              ? t.handleYours
              : status?.ok
                ? t.handleOk
                : t.handleHint;

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave || !status?.ok) return;
        setSaving(true);
        void onSave(status.handle)
          .then((res) => setStatus(res))
          .finally(() => setSaving(false));
      }}
    >
      <label htmlFor="mira-handle-input" className="block">
        <span className="text-xs font-medium tracking-wide text-subtle uppercase">
          {fieldLabel ?? t.handleCurrent}
        </span>
        <input
          id="mira-handle-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="username"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={16}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
          placeholder={initial || "jaime"}
          aria-invalid={Boolean(reason)}
        />
      </label>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed",
          reason ? "text-danger" : status?.ok && !status.unchanged ? "text-fg" : "text-muted",
        )}
      >
        {message}
      </p>
      {suggestions.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs text-subtle">{t.handleTry}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setValue(h)}
                className="h-11 rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg transition-colors duration-150 hover:border-fg"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Button type="submit" className="mt-5 w-full rounded-xl" disabled={!canSave}>
        {saving ? "…" : submitLabel}
      </Button>
    </form>
  );
}
