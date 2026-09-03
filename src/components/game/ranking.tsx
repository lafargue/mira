import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listBoard, submitScore, type BoardPayload } from "@/lib/game/scores";
import { utcDateKey } from "@/lib/game/rng";
import { loadStats } from "@/lib/game/save";
import { visibleBoard } from "@/lib/game/ranking-view";
import { cn } from "@/lib/utils";

export function Ranking({ onClose }: { onClose: () => void }) {
  const { user, isPending } = useCurrentUserState();
  const [tab, setTab] = useState<"daily" | "endless">("daily");
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [error, setError] = useState<"load" | null>(null);
  const [localScore, setLocalScore] = useState(0);
  const dateKey = utcDateKey();
  const rows = visibleBoard(board?.rows ?? [], localScore, Boolean(user));

  useEffect(() => {
    const local = loadStats();
    setLocalScore(tab === "daily" ? (local.today?.score ?? 0) : local.bestEndless);
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void listBoard({ data: { mode: tab, dateKey } })
      .then((payload) => {
        if (!cancelled) setBoard(payload);
      })
      .catch(() => {
        if (!cancelled) setError("load");
      });
    return () => {
      cancelled = true;
    };
  }, [tab, dateKey]);

  useEffect(() => {
    if (isPending || !user) return;
    let cancelled = false;
    const run = async () => {
      const local = loadStats();
      try {
        if (tab === "daily" && local.today?.played && local.today.score > 0 && !local.today.helped) {
          await submitScore({
            data: {
              mode: "daily",
              score: local.today.score,
              dateKey,
              glyphs: local.today.glyphs ?? [],
            },
          });
        }
        if (tab === "endless" && local.bestEndless > 0) {
          await submitScore({
            data: { mode: "endless", score: local.bestEndless, dateKey: "", glyphs: [] },
          });
        }
        const payload = await listBoard({ data: { mode: tab, dateKey } });
        if (!cancelled) {
          setBoard(payload);
          setError(null);
        }
      } catch {
        /* keep whatever list we already have */
      }
    };
    void run();
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

      {board?.myRank ? (
        <p className="mt-5 text-center text-sm text-muted">
          Tu puesto: <span className="tabular-nums text-fg">#{board.myRank}</span>
          {board.total > 1 ? <span className="tabular-nums"> de {board.total}</span> : null}
          {board.myScore !== null ? (
            <span className="tabular-nums"> · {board.myScore.toLocaleString("es")} pts</span>
          ) : null}
        </p>
      ) : localScore > 0 ? (
        <p className="mt-5 text-center text-sm text-muted">
          Tu marca: <span className="tabular-nums text-fg">{localScore.toLocaleString("es")} pts</span>
          {!user ? <span> · entra con tu cuenta para publicarla</span> : null}
        </p>
      ) : (
        <p className="mt-5 text-center text-sm text-muted">
          {tab === "daily" ? "El diario de hoy. Hay que entrar con tu cuenta para aparecer." : "La mejor marca de cada cuenta."}
        </p>
      )}

      {error === "load" && rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">No se pudo cargar el ranking.</p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <ol className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {rows.map((row) => (
              <li
                key={`${row.handle}-${row.rank}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm",
                  row.isYou && "bg-surface-2",
                )}
              >
                <span className="w-6 tabular-nums text-subtle">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {row.handle}{" "}
                  {row.isYou ? (
                    <span className="ml-2 text-xs font-normal text-muted">
                      {row.pending ? "local" : "tú"}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums text-fg">{row.score.toLocaleString("es")}</span>
              </li>
            ))}
          </ol>
          {rows.length === 1 && rows[0]?.isYou ? (
            <p className="mt-3 text-center text-xs text-subtle">
              De momento solo está tu marca. Quien juegue hoy y entre con su cuenta aparece aquí.
            </p>
          ) : tab === "daily" ? (
            <p className="mt-3 text-center text-xs text-subtle">Solo el diario de hoy.</p>
          ) : null}
        </>
      ) : !board && !error ? (
        <div className="mt-4 space-y-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-10 text-center">
          <p className="text-sm text-muted">Nadie ha subido una marca todavía.</p>
          <p className="mt-1 text-xs text-subtle">Juega y entra con tu cuenta. La tuya abre la lista.</p>
        </div>
      )}

      {!isPending && !user ? (
        <div className="mt-auto pt-6">
          <Button asChild className="w-full rounded-xl">
            <Link to="/login">Entra con tu cuenta para aparecer</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
