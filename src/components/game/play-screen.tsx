import type { ReactNode } from "react";
import { ArrowLeft, Volume2, VolumeX, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/game/board";
import {
  DAILY_MOVES,
  PRESSURE_MAX,
  type GameState,
  type Harvested,
  type Pos,
} from "@/lib/game/engine";
import type { Stats } from "@/lib/game/save";
import { TIP_COST } from "@/lib/game/wallet";
import { usePrefs } from "@/lib/prefs-context";
import { cn } from "@/lib/utils";

export function Play({
  game,
  stats,
  dailyN,
  preview,
  popping,
  spawning,
  shake,
  busy,
  banner,
  floatScore,
  hint,
  coach,
  credits,
  tipBusy,
  onBack,
  onCellDown,
  onCellUp,
  onCancel,
  onMute,
  onTip,
  children,
}: {
  game: GameState;
  stats: Stats;
  dailyN: number;
  preview: { harvested: Harvested[]; walls: Pos[]; row: number; col: number } | null;
  popping: Set<number>;
  spawning: Set<number>;
  shake: boolean;
  busy: boolean;
  banner: string | null;
  floatScore: string | null;
  hint: Pos | null;
  coach: string | null;
  credits: number;
  tipBusy: boolean;
  onBack: () => void;
  onCellDown: (r: number, c: number) => void;
  onCellUp: (r: number, c: number) => void;
  onCancel: () => void;
  onMute: () => void;
  onTip: () => void;
  children: ReactNode;
}) {
  const { t } = usePrefs();
  const remaining = DAILY_MOVES - game.moves;
  const empty = credits < TIP_COST;
  const canTip = !game.over && !busy && !tipBusy && !hint;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label={t.back}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted uppercase">
            {game.mode === "daily" ? `${t.daily} #${dailyN}` : t.endless}
          </p>
          <p className="font-display text-2xl leading-none tabular-nums tracking-tight">{game.score.toLocaleString("es")}</p>
        </div>
        <button
          type="button"
          onClick={onTip}
          disabled={!canTip}
          className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-muted transition-colors duration-150 hover:text-fg disabled:opacity-40"
          aria-label={canTip && !empty ? `${t.tip}, ${TIP_COST}` : t.shopOpen}
        >
          <Wand2 className="size-5" strokeWidth={1.75} />
          <span className="text-xs tabular-nums">{credits}</span>
        </button>
        <button
          type="button"
          onClick={onMute}
          className="flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
          aria-label={stats.muted ? t.soundOn : t.soundOff}
        >
          {stats.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </header>

      {game.mode === "endless" ? (
        <Pressure value={game.pressure} />
      ) : (
        <p className="text-center text-xs tabular-nums text-muted">
          {remaining} {t.pulsesLeft}
        </p>
      )}

      <div className="relative">
        <BoardView
          board={game.board}
          preview={game.over ? null : preview}
          poppingIds={popping}
          spawnIds={spawning}
          shake={shake}
          locked={busy || game.over}
          hint={hint}
          onCellDown={onCellDown}
          onCellUp={onCellUp}
          onCancel={onCancel}
        />
        {banner ? (
          <div className="combo-banner pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-bg/70 p-4">
            <div className="rounded-xl border border-border bg-bg px-5 py-3 text-center">
              <p className="font-display text-3xl tracking-tight text-fg">{banner}</p>
              {floatScore ? (
                <p className="mt-1 text-sm font-medium tabular-nums text-fg">{floatScore}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {game.over ? (
        children
      ) : (
        <div className="mt-auto flex flex-col gap-3">
          <Button variant="secondary" className="w-full rounded-xl" onClick={onTip} disabled={!canTip}>
            <Wand2 className="size-4" strokeWidth={1.75} />
            {empty ? t.shopOpen : `${t.tip} · ${TIP_COST} · ${credits} ${t.credits}`}
          </Button>
          <p className="text-center text-sm leading-relaxed text-muted">{coach ?? t.holdHint}</p>
        </div>
      )}
    </div>
  );
}

function Pressure({ value }: { value: number }) {
  const { t } = usePrefs();
  const hot = value >= PRESSURE_MAX - 2;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[0.65rem] font-medium tracking-wide text-subtle uppercase">
        <span>{t.pressure}</span>
        <span className={cn("tabular-nums", hot && "text-danger")}>
          {value}/{PRESSURE_MAX}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: PRESSURE_MAX }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < value ? (hot ? "bg-danger" : "bg-accent") : "bg-surface-2",
            )}
          />
        ))}
      </div>
    </div>
  );
}
