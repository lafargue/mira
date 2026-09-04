import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClaimHandle } from "@/components/game/claim-handle";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useProfile } from "@/lib/game/use-profile";
import { usePrefs } from "@/lib/prefs-context";
import { restorePreviewSession } from "@/lib/session-persist";

restorePreviewSession();

export const Route = createFileRoute("/claim")({ component: ClaimPage });

function ClaimPage() {
  const { t } = usePrefs();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const profile = useProfile();

  useEffect(() => {
    if (profile.ready && profile.handle) {
      void navigate({ to: "/" });
    }
  }, [profile.ready, profile.handle, navigate]);

  if (!isPending && !user) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm text-muted">{t.loginBody}</p>
          <Link
            to="/login"
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-fg"
          >
            {t.enter}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {!profile.ready || isPending || profile.handle ? (
        <div className="flex flex-1 items-center justify-center" aria-hidden="true">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-surface" />
        </div>
      ) : (
        <ClaimHandle
          suggested={profile.suggested}
          onCheck={profile.check}
          onSave={async (value) => {
            const res = await profile.save(value);
            if (res.ok) void navigate({ to: "/" });
            return res;
          }}
        />
      )}
    </main>
  );
}
