import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listBoard, type BoardPayload } from "@/lib/game/scores";
import { utcDateKey } from "@/lib/game/rng";
import { cn } from "@/lib/utils";

export function Ranking({ onClose }: { onClose: () => void }) {
  const { user, isPending } = useCurrentUserState();
  const [tab, setTab] = useState<"daily" | "endless">("daily");
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);
  const dateKey = utcDateKey();

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setError("auth");
      setBoard(null);
      return;
    }
    let cancelled = false;
    setBoard(null);
    setError(null);
    void listBoard({ data: { mode: tab, dateKey } })
      .then((payload) => {
        if (!cancelled) setBoard(payload);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "";
        setError(msg === "Unauthorized" ? "auth" : "load");
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending, tab, dateKey]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <h2 className="font-display text-2xl tracking-tight">Ranking</h2>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab("daily")}
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-colors duration-150",
            tab === "daily" ? "bg-surface-2 text-fg" : "text-muted",
          )}
        >
          Diario
        </button>
        <button
          type="button"
          onClick={() => setTab("endless")}
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-colors duration-150",
            tab === "endless" ? "bg-surface-2 text-fg" : "text-muted",
          )}
        >
          Sin fin
        </button>
      </div>

      {error === "auth" || (!isPending && !user) ? (
        <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-[16rem] text-sm leading-relaxed text-muted">
            Entra para ver el ranking de hoy y subir tu marca. El diario es el mismo para todo el mundo.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      ) : null}

      {error === "load" ? (
        <p className="mt-8 text-center text-sm text-muted">No se pudo cargar el ranking.</p>
      ) : null}

      {board ? (
        <div className="mt-6 flex flex-1 flex-col">
          {board.myRank ? (
            <p className="text-center text-sm text-muted">
              Tu puesto: <span className="tabular-nums text-fg">#{board.myRank}</span>
              {board.myScore !== null ? (
                <span className="tabular-nums"> · {board.myScore.toLocaleString("es")} pts</span>
              ) : null}
            </p>
          ) : (
            <p className="text-center text-sm text-muted">Juega una partida y sube tu marca.</p>
          )}
          {board.rows.length === 0 ? (
            <p className="mt-8 text-center text-sm text-subtle">Nadie ha subido una marca todavía.</p>
          ) : (
            <ol className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
              {board.rows.map((row, i) => (
                <li
                  key={`${row.handle}-${i}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm",
                    row.isYou && "bg-surface-2",
                  )}
                >
                  <span className="w-6 tabular-nums text-subtle">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {row.handle}
                    {row.isYou ? <span className="ml-2 text-xs font-normal text-muted">tú</span> : null}
                  </span>
                  <span className="tabular-nums text-fg">{row.score.toLocaleString("es")}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}

      {isPending || (user && !board && !error) ? (
        <div className="mt-8 space-y-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
