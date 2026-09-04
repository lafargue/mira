import { signOut } from "@/lib/auth/client";
import { HandleForm } from "@/components/game/handle-form";
import type { SetHandleResult } from "@/lib/game/profile";
import { usePrefs } from "@/lib/prefs-context";
import { useState } from "react";

export function ClaimHandle({
  suggested,
  suggestions = [],
  onCheck,
  onSave,
}: {
  suggested: string;
  suggestions?: string[];
  onCheck: (value: string) => Promise<SetHandleResult>;
  onSave: (value: string) => Promise<SetHandleResult>;
}) {
  const { t } = usePrefs();
  const [leaving, setLeaving] = useState(false);

  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Mira</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">{t.handleTitle}</h2>
      <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-muted">{t.handleBody}</p>
      <HandleForm
        initial={suggested}
        submitLabel={t.handleContinue}
        fieldLabel={t.handleCurrent}
        autoFocus
        inputId="mira-claim-handle"
        seedSuggestions={suggestions}
        onCheck={onCheck}
        onSave={onSave}
      />
      <button
        type="button"
        disabled={leaving}
        onClick={() => {
          setLeaving(true);
          void signOut().catch(() => setLeaving(false));
        }}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-xl text-sm text-muted transition-colors duration-150 hover:text-fg disabled:opacity-40"
      >
        {leaving ? "…" : t.leave}
      </button>
    </div>
  );
}
