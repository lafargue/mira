import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { clearPersistedSession, hasPreviewToken } from "@/lib/session-persist";
import { useEffect, useState } from "react";

export function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (isPending || user) return;
    if (hasPreviewToken()) clearPersistedSession();
  }, [isPending, user]);

  if (isPending) {
    return <div className="h-11 w-20 animate-pulse rounded-lg bg-surface" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex h-11 items-center rounded-lg px-3 text-sm text-muted transition-colors duration-150 hover:text-fg"
      >
        Entrar
      </Link>
    );
  }

  const label = user.displayName ?? "Tú";
  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[7rem] truncate text-xs text-muted">{label}</span>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        }}
        className="flex h-11 items-center rounded-lg px-2 text-xs text-muted transition-colors duration-150 hover:text-fg disabled:opacity-40"
      >
        {signingOut ? "…" : "Salir"}
      </button>
    </div>
  );
}
