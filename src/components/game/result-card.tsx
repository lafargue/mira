import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RotateCcw, Share2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlyphLegend } from "@/components/game/board";
import type { GameState } from "@/lib/game/engine";
import type { Stats } from "@/lib/game/save";
import { renderGlyphGrid } from "@/lib/game/share";
import { submitScore } from "@/lib/game/scores";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePrefs } from "@/lib/prefs-context";

export function ResultCard({
  game,
  stats,
  shareMsg,
  glyphs,
  helped,
  onRetry,
  onShare,
  onBack,
}: {
  game: GameState;
  stats: Stats;
  shareMsg: string | null;
  glyphs: number[];
  helped: boolean;
  onRetry: () => void;
  onShare: () => void;
  onBack: () => void;
}) {
  const { t } = usePrefs();
  const best = game.mode === "daily" ? stats.bestDaily : stats.bestEndless;
  const record = game.score > 0 && game.score >= best && !(game.mode === "daily" && helped);
  const shownGlyphs = stats.today?.glyphs?.length ? stats.today.glyphs : glyphs;

  return (
    <section className="mt-auto rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted uppercase">
        {game.mode === "daily" ? t.resultToday : t.resultEnd}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-4xl tabular-nums tracking-tight">{game.score.toLocaleString("es")}</p>
        <div className="flex flex-col items-end gap-1">
          {record ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[0.65rem] text-muted">
              <Trophy className="size-3" />
              {t.record}
            </span>
          ) : null}
          {helped && game.mode === "daily" ? (
            <span className="inline-flex items-center rounded-full border border-border px-2 py-1 text-[0.65rem] text-muted">
              {t.helpedMark}
            </span>
          ) : null}
        </div>
      </div>
      {helped && game.mode === "daily" ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{t.tipDailyWarn}</p>
      ) : null}
      {game.mode === "daily" && shownGlyphs.length ? (
        <>
          <pre className="mt-3 text-center text-lg leading-7 tracking-[0.2em]">{renderGlyphGrid(shownGlyphs)}</pre>
          <GlyphLegend compact />
        </>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {game.mode === "daily" ? (
          <Button className="w-full rounded-xl" onClick={onShare}>
            <Share2 className="size-4" />
            {shareMsg ?? t.challenge}
          </Button>
        ) : null}
        <ScorePost game={game} glyphs={shownGlyphs} helped={helped} />
        <Button variant="secondary" className="w-full rounded-xl" onClick={onRetry}>
          <RotateCcw className="size-4" />
          {t.retry}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          {t.menu}
        </Button>
      </div>
    </section>
  );
}

function ScorePost({ game, glyphs, helped }: { game: GameState; glyphs: number[]; helped: boolean }) {
  const { t } = usePrefs();
  const { user, isPending } = useCurrentUserState();
  const [status, setStatus] = useState<"idle" | "ok" | "err" | "helped" | "kept">("idle");

  useEffect(() => {
    if (game.mode === "daily" && helped) {
      setStatus("helped");
      return;
    }
    if (isPending || !user) return;
    let cancelled = false;
    void submitScore({
      data: {
        mode: game.mode,
        score: game.score,
        dateKey: game.dateKey ?? "",
        glyphs,
        helped,
      },
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.score === game.score) setStatus("ok");
        else if (res.ok || "skipped" in res) setStatus("kept");
        else setStatus("err");
      })
      .catch(() => {
        if (!cancelled) setStatus("err");
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending, game.mode, game.score, game.dateKey, glyphs, helped]);

  if (status === "helped") {
    return <p className="text-center text-xs text-muted">{t.tipDailyWarn}</p>;
  }
  if (status === "kept") return null;

  if (isPending) return <div className="h-11 animate-pulse rounded-xl bg-surface-2" />;

  if (!user) {
    return (
      <Button asChild variant="secondary" className="w-full rounded-xl">
        <Link to="/login">{t.signInToBeSeen}</Link>
      </Button>
    );
  }

  if (status === "ok") {
    return <p className="text-center text-xs text-muted">{t.scorePosted}</p>;
  }
  if (status === "err") {
    return <p className="text-center text-xs text-muted">{t.scoreFail}</p>;
  }
  return <p className="text-center text-xs text-subtle">{t.scorePosting}</p>;
}
