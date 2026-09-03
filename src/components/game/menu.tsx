import { CalendarDays, HelpCircle, Infinity, Settings2, Trophy, Volume2, VolumeX, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorLegend } from "@/components/game/board";
import { AuthChip } from "@/components/game/auth-chip";
import { usePrefs } from "@/lib/prefs-context";
import type { Stats } from "@/lib/game/save";

export function Menu({
  stats,
  dailyN,
  todayPlayed,
  credits,
  onDaily,
  onEndless,
  onHelp,
  onRanking,
  onSettings,
  onMute,
}: {
  stats: Stats;
  dailyN: number;
  todayPlayed: boolean;
  credits: number;
  onDaily: () => void;
  onEndless: () => void;
  onHelp: () => void;
  onRanking: () => void;
  onSettings: () => void;
  onMute: () => void;
}) {
  const { t } = usePrefs();
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onHelp}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label={t.howToPlay}
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center">
          <AuthChip />
          <button
            type="button"
            onClick={onSettings}
            className="flex h-11 items-center gap-1.5 rounded-lg px-2 text-muted transition-colors duration-150 hover:text-fg"
            aria-label={`${t.credits} ${credits}`}
          >
            <Wand2 className="size-4" strokeWidth={1.75} />
            <span className="font-display text-base tabular-nums text-fg">{credits}</span>
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
            aria-label={t.settings}
          >
            <Settings2 className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onMute}
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
            aria-label={stats.muted ? t.soundOn : t.soundOff}
          >
            {stats.muted ? <VolumeX className="size-5" strokeWidth={1.75} /> : <Volume2 className="size-5" strokeWidth={1.75} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Mira #{dailyN}</p>
          <h1 className="font-display text-6xl font-medium tracking-[-0.04em] text-fg">MIRA</h1>
          <p className="max-w-[18rem] text-sm leading-snug text-muted">{t.tagline}</p>
          <button
            type="button"
            onClick={onHelp}
            className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            {t.howToPlay}
          </button>
        </div>
        <ColorLegend />
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button size="lg" className="w-full rounded-xl" onClick={onDaily}>
            <CalendarDays className="size-4" strokeWidth={1.75} />
            {todayPlayed ? t.dailyAgain : t.daily}
          </Button>
          <Button size="lg" variant="secondary" className="w-full rounded-xl" onClick={onEndless}>
            <Infinity className="size-4" strokeWidth={1.75} />
            {t.endless}
          </Button>
          <Button size="lg" variant="ghost" className="w-full rounded-xl" onClick={onRanking}>
            <Trophy className="size-4" strokeWidth={1.75} />
            {t.ranking}
          </Button>
        </div>
        <button
          type="button"
          onClick={onSettings}
          className="flex w-full max-w-xs items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left"
          aria-label={t.credits}
        >
          <span className="flex items-center gap-2 text-sm text-muted">
            <Wand2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {t.credits}
          </span>
          <span className="font-display text-2xl tabular-nums text-fg">{credits}</span>
        </button>
        <dl className="grid w-full max-w-xs grid-cols-3 gap-2 text-center">
          <Stat label={t.streak} value={stats.streak} />
          <Stat label={t.daily} value={stats.bestDaily} />
          <Stat label={t.endless} value={stats.bestEndless} />
        </dl>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-2 py-3">
      <dt className="text-[0.65rem] font-medium tracking-wide text-subtle uppercase">{label}</dt>
      <dd className="mt-1 font-display text-lg tabular-nums text-fg">{value.toLocaleString("es")}</dd>
    </div>
  );
}
