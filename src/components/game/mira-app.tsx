import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  HelpCircle,
  Infinity,
  RotateCcw,
  Share2,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardView, ColorLegend, ComboGuide, GlyphLegend, HelpDiagram } from "@/components/game/board";
import { AuthChip } from "@/components/game/auth-chip";
import { Ranking } from "@/components/game/ranking";
import {
  DAILY_MOVES,
  PRESSURE_MAX,
  SIZE,
  applyPulse,
  createGame,
  previewHarvest,
  pulse,
  pulseGlyph,
  type GameState,
  type Harvested,
  type Mode,
  type Pos,
  type PulseResult,
} from "@/lib/game/engine";
import { dailyNumber, dailySeed, utcDateKey } from "@/lib/game/rng";
import { loadStats, saveStats, streakAfterPlay, type Stats } from "@/lib/game/save";
import { renderGlyphGrid, shareOrCopy, shareText } from "@/lib/game/share";
import { submitScore } from "@/lib/game/scores";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  playEvolve,
  playGameOver,
  playHarvest,
  playTap,
  playWin,
  setMuted,
  unlockAudio,
} from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { restorePreviewSession } from "@/lib/session-persist";

restorePreviewSession();

type Screen = "menu" | "play" | "help" | "ranking";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MiraApp() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [stats, setStats] = useState<Stats>(() => ({
    version: 1,
    bestEndless: 0,
    bestDaily: 0,
    bestCombo: 0,
    games: 0,
    streak: 0,
    lastDaily: null,
    today: null,
    muted: false,
    seenHowTo: false,
    seenTutorial: false,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{
    harvested: Harvested[];
    walls: Pos[];
    row: number;
    col: number;
  } | null>(null);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [spawning, setSpawning] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [floatScore, setFloatScore] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [glyphs, setGlyphs] = useState<number[]>([]);
  const [tutorial, setTutorial] = useState(false);
  const [nudge, setNudge] = useState(false);
  const dateKey = utcDateKey();
  const cancelRef = useRef(false);
  const bannerGen = useRef(0);
  const previewRef = useRef(preview);
  previewRef.current = preview;

  useEffect(() => {
    const loaded = loadStats();
    if (loaded.today && loaded.today.dateKey !== utcDateKey()) {
      loaded.today = null;
    }
    setStats(loaded);
    setHydrated(true);
    setMuted(loaded.muted);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStats(stats);
  }, [stats, hydrated]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const persist = useCallback((patch: Partial<Stats>) => {
    setStats((s) => ({ ...s, ...patch }));
  }, []);

  const start = useCallback(
    (mode: Mode) => {
      unlockAudio();
      cancelRef.current = false;
      const seed = mode === "daily" ? dailySeed(dateKey) : (Math.random() * 0xffffffff) >>> 0;
      const next = createGame(mode, seed, mode === "daily" ? dateKey : null);
      setGame(next);
      setGlyphs([]);
      setBanner(null);
      setFloatScore(null);
      setPopping(new Set());
      setSpawning(new Set());
      setPreview(null);
      setBusy(false);
      const first = !stats.seenTutorial;
      setTutorial(first);
      setNudge(first);
      setScreen("play");
    },
    [dateKey, stats.seenTutorial],
  );

  const finishGame = useCallback(
    (ended: GameState, runGlyphs: number[]) => {
      setStats((s) => {
        const next = { ...s, games: s.games + 1, bestCombo: Math.max(s.bestCombo, ended.bestCombo) };
        if (ended.mode === "endless") {
          next.bestEndless = Math.max(s.bestEndless, ended.score);
        } else if (ended.dateKey) {
          const firstToday = s.lastDaily !== ended.dateKey;
          next.streak = streakAfterPlay(s, ended.dateKey);
          next.lastDaily = ended.dateKey;
          const prevScore = s.today?.dateKey === ended.dateKey ? s.today.score : 0;
          const best = Math.max(prevScore, ended.score);
          next.bestDaily = Math.max(s.bestDaily, best);
          next.today = {
            dateKey: ended.dateKey,
            score: best,
            glyphs: prevScore > ended.score && s.today ? s.today.glyphs : runGlyphs,
            played: true,
          };
          if (firstToday) {
            /* streak already applied */
          }
        }
        return next;
      });
      if (ended.mode === "daily") playWin();
      else playGameOver();
    },
    [],
  );

  const runPulse = useCallback(
    async (r: number, c: number) => {
      if (!game || busy || game.over) return;
      const result: PulseResult = pulse(game, r, c);
      if (result.harvested.length === 0) return;
      unlockAudio();
      playTap();
      setBusy(true);
      setPreview({
        harvested: result.harvested,
        walls: result.evolved.map((e) => ({ r: e.r, c: e.c })),
        row: r,
        col: c,
      });
      const fast = reducedMotion();
      const pause = async (ms: number) => {
        await wait(fast ? 30 : ms);
        if (cancelRef.current) throw new Error("cancelled");
      };

      try {
        await pause(90);
        setPopping(new Set(result.harvested.map((h) => h.id)));
        playHarvest(result.harvested.length, result.cascades.length > 0);
        const gen = ++bannerGen.current;
        setBanner(result.comboName);
        setFloatScore(`+${result.scoreDelta.toLocaleString("es")} pts`);
        if (result.harvested.length >= 5 || result.cascades.length) {
          setShake(true);
          setTimeout(() => setShake(false), 300);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
        }
        await pause(220);

        if (result.evolved.length) {
          playEvolve();
          setGame((g) => {
            if (!g) return g;
            const board = g.board.map((row) => row.slice());
            for (const e of result.evolved) {
              const t = board[e.r][e.c];
              if (t && t.id === e.id) board[e.r][e.c] = { id: e.id, color: e.to };
            }
            return { ...g, board };
          });
          await pause(160);
        }

        setPopping(new Set());
        setSpawning(new Set(result.spawns.map((s) => s.id)));
        setGame((g) => (g ? { ...g, board: result.boardAfterTap } : g));
        setPreview(null);
        await pause(240);
        setSpawning(new Set());

        for (const step of result.cascades) {
          setPopping(new Set(step.harvested.map((h) => h.id)));
          setBanner("Mira");
          playHarvest(step.harvested.length, true);
          setShake(true);
          setTimeout(() => setShake(false), 280);
          await pause(200);
          setPopping(new Set());
          setSpawning(new Set(step.spawns.map((s) => s.id)));
          setGame((g) => (g ? { ...g, board: step.board } : g));
          await pause(220);
          setSpawning(new Set());
        }

        const next = applyPulse(game, result);
        const nextGlyphs = [...glyphs, pulseGlyph(result)];
        setGlyphs(nextGlyphs);
        setGame(next);
        setBusy(false);
        if (next.over) finishGame(next, nextGlyphs);
        await pause(fast ? 80 : 720);
        if (bannerGen.current === gen) {
          setBanner(null);
          setFloatScore(null);
        }
      } catch {
        setBusy(false);
        setPreview(null);
        setPopping(new Set());
        setSpawning(new Set());
        setBanner(null);
        setFloatScore(null);
      }
    },
    [busy, finishGame, game, glyphs],
  );

  const onCellDown = (r: number, c: number) => {
    if (!game || busy || game.over) return;
    const { harvested, walls } = previewHarvest(game.board, r, c);
    setPreview({ harvested, walls, row: r, col: c });
  };

  const onCellUp = (r: number, c: number) => {
    const p = previewRef.current;
    if (!p || p.row !== r || p.col !== c) {
      setPreview(null);
      return;
    }
    void runPulse(r, c);
  };

  const todayPlayed = stats.today?.dateKey === dateKey;
  const dailyN = dailyNumber(dateKey);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {screen === "menu" ? (
        <Menu
          stats={stats}
          dailyN={dailyN}
          todayPlayed={todayPlayed}
          onDaily={() => start("daily")}
          onEndless={() => start("endless")}
          onHelp={() => setScreen("help")}
          onRanking={() => setScreen("ranking")}
          onMute={() => {
            const next = !stats.muted;
            persist({ muted: next });
            unlockAudio();
            setMuted(next);
          }}
        />
      ) : null}

      {screen === "help" ? (
        <Help
          onClose={() => {
            persist({ seenHowTo: true, seenTutorial: true });
            setScreen("menu");
          }}
        />
      ) : null}

      {screen === "ranking" ? <Ranking onClose={() => setScreen("menu")} /> : null}

      {screen === "play" && game && tutorial ? (
        <Tutorial
          onBack={() => {
            setTutorial(false);
            setNudge(false);
            setGame(null);
            setScreen("menu");
          }}
          onPlay={() => {
            persist({ seenHowTo: true, seenTutorial: true });
            setTutorial(false);
          }}
        />
      ) : null}

      {screen === "play" && game && !tutorial ? (
        <Play
          game={game}
          stats={stats}
          dailyN={dailyN}
          preview={preview}
          popping={popping}
          spawning={spawning}
          shake={shake}
          busy={busy}
          banner={banner}
          floatScore={floatScore}
          glyphs={glyphs}
          shareMsg={shareMsg}
          onBack={() => {
            cancelRef.current = true;
            setScreen("menu");
            setGame(null);
          }}
          onRetry={() => start(game.mode)}
          onCellDown={onCellDown}
          onCellUp={onCellUp}
          onCancel={() => {
            if (!busy) setPreview(null);
          }}
          onShare={async () => {
            const g = game.dateKey ? glyphs : [];
            const text = shareText({
              dateKey: game.dateKey ?? dateKey,
              score: stats.today?.score ?? game.score,
              glyphs: stats.today?.glyphs?.length ? stats.today.glyphs : g,
              streak: stats.streak,
            });
            const res = await shareOrCopy(text);
            setShareMsg(res === "copied" ? "Copiado" : res === "shared" ? "Hecho" : "No se pudo compartir");
            setTimeout(() => setShareMsg(null), 1600);
          }}
          hint={nudge && game.moves === 0 && !preview && !busy && !game.over ? bestTap(game.board) : null}
          coach={nudge && game.moves === 0 && !game.over ? "Toca la ficha que late. Se comen las del mismo color en cruz." : null}
          onMute={() => {
            const next = !stats.muted;
            persist({ muted: next });
            setMuted(next);
          }}
        />
      ) : null}
    </main>
  );
}

function Menu({
  stats,
  dailyN,
  todayPlayed,
  onDaily,
  onEndless,
  onHelp,
  onRanking,
  onMute,
}: {
  stats: Stats;
  dailyN: number;
  todayPlayed: boolean;
  onDaily: () => void;
  onEndless: () => void;
  onHelp: () => void;
  onRanking: () => void;
  onMute: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onHelp}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label="Cómo se juega"
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center">
          <AuthChip />
          <button
            type="button"
            onClick={onMute}
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
            aria-label={stats.muted ? "Activar sonido" : "Silenciar"}
          >
            {stats.muted ? <VolumeX className="size-5" strokeWidth={1.75} /> : <Volume2 className="size-5" strokeWidth={1.75} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Mira #{dailyN}</p>
          <h1 className="font-display text-6xl font-medium tracking-[-0.04em] text-fg">MIRA</h1>
          <p className="max-w-[18rem] text-sm leading-snug text-muted">
            Toca un color. Se come en cruz hasta chocar con otro.
          </p>
          <button
            type="button"
            onClick={onHelp}
            className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Cómo se juega
          </button>
        </div>
        <ColorLegend />
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button size="lg" className="w-full rounded-xl" onClick={onDaily}>
            <CalendarDays className="size-4" strokeWidth={1.75} />
            {todayPlayed ? "Diario · repetir" : "Diario"}
          </Button>
          <Button size="lg" variant="secondary" className="w-full rounded-xl" onClick={onEndless}>
            <Infinity className="size-4" strokeWidth={1.75} />
            Sin fin
          </Button>
          <Button size="lg" variant="ghost" className="w-full rounded-xl" onClick={onRanking}>
            <Trophy className="size-4" strokeWidth={1.75} />
            Ranking
          </Button>
        </div>
        <dl className="grid w-full max-w-xs grid-cols-3 gap-2 text-center">
          <Stat label="Racha" value={stats.streak} />
          <Stat label="Diario" value={stats.bestDaily} />
          <Stat label="Sin fin" value={stats.bestEndless} />
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

function Play({
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
  glyphs,
  shareMsg,
  onBack,
  onRetry,
  onCellDown,
  onCellUp,
  onCancel,
  onShare,
  onMute,
  hint,
  coach,
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
  glyphs: number[];
  shareMsg: string | null;
  onBack: () => void;
  onRetry: () => void;
  onCellDown: (r: number, c: number) => void;
  onCellUp: (r: number, c: number) => void;
  onCancel: () => void;
  onShare: () => void;
  onMute: () => void;
  hint: Pos | null;
  coach: string | null;
}) {
  const remaining = DAILY_MOVES - game.moves;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted uppercase">
            {game.mode === "daily" ? `Diario #${dailyN}` : "Sin fin"}
          </p>
          <p className="font-display text-2xl leading-none tabular-nums tracking-tight">{game.score.toLocaleString("es")}</p>
        </div>
        <button
          type="button"
          onClick={onMute}
          className="flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
          aria-label="Sonido"
        >
          {stats.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </header>

      {game.mode === "endless" ? (
        <Pressure value={game.pressure} />
      ) : (
        <p className="text-center text-xs tabular-nums text-muted">{remaining} pulsos</p>
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
        <ResultCard
          game={game}
          stats={stats}
          shareMsg={shareMsg}
          glyphs={glyphs}
          onRetry={onRetry}
          onShare={onShare}
          onBack={onBack}
        />
      ) : (
        <p className="mt-auto text-center text-sm leading-relaxed text-muted">
          {coach ?? "Mantén pulsado para ver la cruz. Suelta para jugar."}
        </p>
      )}
    </div>
  );
}

function Pressure({ value }: { value: number }) {
  const hot = value >= PRESSURE_MAX - 2;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[0.65rem] font-medium tracking-wide text-subtle uppercase">
        <span>Pulso</span>
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

function ResultCard({
  game,
  stats,
  shareMsg,
  glyphs,
  onRetry,
  onShare,
  onBack,
}: {
  game: GameState;
  stats: Stats;
  shareMsg: string | null;
  glyphs: number[];
  onRetry: () => void;
  onShare: () => void;
  onBack: () => void;
}) {
  const record =
    game.mode === "daily"
      ? (stats.today?.score ?? game.score) >= stats.bestDaily && game.score > 0
      : game.score >= stats.bestEndless && game.score > 0;
  const shownGlyphs = stats.today?.glyphs?.length ? stats.today.glyphs : glyphs;

  return (
    <section className="mt-auto rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted uppercase">
        {game.mode === "daily" ? "Resultado de hoy" : "Fin de la partida"}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-4xl tabular-nums tracking-tight">{game.score.toLocaleString("es")}</p>
        {record ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[0.65rem] text-muted">
            <Trophy className="size-3" />
            Récord
          </span>
        ) : null}
      </div>
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
            {shareMsg ?? "Retar a un amigo"}
          </Button>
        ) : null}
        <ScorePost game={game} glyphs={shownGlyphs} />
        <Button variant="secondary" className="w-full rounded-xl" onClick={onRetry}>
          <RotateCcw className="size-4" />
          Otra vez
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          Menú
        </Button>
      </div>
    </section>
  );
}

function ScorePost({ game, glyphs }: { game: GameState; glyphs: number[] }) {
  const { user, isPending } = useCurrentUserState();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  useEffect(() => {
    if (isPending || !user) return;
    let cancelled = false;
    void submitScore({
      data: {
        mode: game.mode,
        score: game.score,
        dateKey: game.dateKey ?? "",
        glyphs,
      },
    })
      .then(() => {
        if (!cancelled) setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("err");
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending, game.mode, game.score, game.dateKey, glyphs]);

  if (isPending) return <div className="h-11 animate-pulse rounded-xl bg-surface-2" />;

  if (!user) {
    return (
      <Button asChild variant="secondary" className="w-full rounded-xl">
        <Link to="/login">Entra con tu cuenta para que te vean</Link>
      </Button>
    );
  }

  if (status === "ok") {
    return <p className="text-center text-xs text-muted">Marca subida al ranking</p>;
  }
  if (status === "err") {
    return <p className="text-center text-xs text-muted">No se pudo subir la marca</p>;
  }
  return <p className="text-center text-xs text-subtle">Subiendo marca…</p>;
}

function Help({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Cómo se juega</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="mt-5 flex flex-col gap-6 pb-4">
        <HelpDiagram />

        <ol className="flex flex-col gap-5 text-sm leading-relaxed text-muted">
          <li>
            <span className="block font-medium text-fg">1. Toca una ficha</span>
            Desaparecen esa y todas las del mismo color en cruz: arriba, abajo, izquierda y derecha. El pulso para al chocar con otro color.
          </li>
          <li>
            <span className="block font-medium text-fg">2. El muro cambia de color</span>
            La ficha que paró la cruz (anillo suave) evoluciona: rosa → verde → azul → rosa. Estás preparando el siguiente toque.
          </li>
          <li>
            <span className="block font-medium text-fg">3. Caen y pueden estallar</span>
            Los huecos se rellenan desde arriba. Si quedan cuatro o más iguales en línea, estallan solas. Eso es una Mira y vale el doble.
          </li>
          <li>
            <span className="block font-medium text-fg">4. Diario o sin fin</span>
            Diario: 12 toques, el mismo tablero para todo el mundo. Sin fin: cada toque flojo llena la barra; si se llena, se acabó.
          </li>
        </ol>

        <ComboGuide />

        <GlyphLegend />

        <ColorLegend />
      </div>

      <div className="sticky bottom-0 mt-auto bg-bg pt-3">
        <Button className="w-full rounded-xl" onClick={onClose}>
          Jugar
        </Button>
      </div>
    </div>
  );
}

function bestTap(board: GameState["board"]): Pos {
  let best: Pos = { r: 0, c: 0 };
  let bestN = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) continue;
      const n = previewHarvest(board, r, c).harvested.length;
      if (n > bestN) {
        best = { r, c };
        bestN = n;
      }
    }
  }
  return best;
}

function Tutorial({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  return (
    <div className="flex flex-1 flex-col" data-testid="mira-tutorial">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <h2 className="font-display text-2xl tracking-tight">Cómo se juega</h2>
      </header>

      <div className="mt-5 flex flex-col gap-6 pb-4">
        <HelpDiagram />

        <ol className="flex flex-col gap-4 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-fg">Toca un color.</span> Se come en cruz hasta chocar con otro.
          </li>
          <li>
            <span className="font-medium text-fg">El muro cambia.</span> Rosa → verde → azul → rosa.
          </li>
          <li>
            <span className="font-medium text-fg">Cuatro en línea</span> estallan solas. Eso es una Mira y duplica.
          </li>
        </ol>

        <ComboGuide />
      </div>

      <div className="sticky bottom-0 mt-auto bg-bg pt-3">
        <Button className="w-full rounded-xl" onClick={onPlay}>
          Tocar
        </Button>
      </div>
    </div>
  );
}

