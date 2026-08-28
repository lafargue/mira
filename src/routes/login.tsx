import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-fg">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Mira</p>
        <h1 className="font-display mt-2 text-3xl tracking-tight">Entra para el ranking</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Juega sin cuenta. Para subir tu marca y ver a los demás, entra con Google o X.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full rounded-xl"
                onClick={() => void signIn(p.providerId, { callbackURL: "/", errorCallbackURL: "/login" })}
              >
                Continuar con {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">El acceso está desactivado.</p>
          )}
        </div>
        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted transition-colors duration-150 hover:text-fg"
        >
          Volver a jugar
        </Link>
      </div>
    </main>
  );
}
