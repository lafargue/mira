import { useCallback, useEffect, useRef, useState } from "react";
import { ClaimHandle } from "@/components/game/claim-handle";
import { Help, Tutorial } from "@/components/game/help-screens";
import { Menu } from "@/components/game/menu";
import { Play } from "@/components/game/play-screen";
import { Ranking } from "@/components/game/ranking";
import { ResultCard } from "@/components/game/result-card";
import { Settings } from "@/components/game/settings";
import {
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
import { shareOrCopy, shareText } from "@/lib/game/share";
import {
  playEvolve,
  playGameOver,
  playHarvest,
  playTap,
  playWin,
  setMuted,
  unlockAudio,
} from "@/lib/game/audio";
import { restorePreviewSession } from "@/lib/session-persist";
import { usePrefs } from "@/lib/prefs-context";
import { useCredits } from "@/lib/game/use-credits";
import { useProfile } from "@/lib/game/use-profile";
import { bestTap } from "@/lib/game/hint";

restorePreviewSession();

type Screen = "menu" | "play" | "help" | "ranking" | "settings";

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
  const { t } = usePrefs();
  const credits = useCredits();
  const profile = useProfile();
  const [helped, setHelped] = useState(false);
  const [tipHint, setTipHint] = useState<Pos | null>(null);
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
      setHelped(false);
      setTipHint(null);
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
          next.streak = streakAfterPlay(s, ended.dateKey);
          next.lastDaily = ended.dateKey;
          const prevScore = s.today?.dateKey === ended.dateKey ? s.today.score : 0;
          const keepPrev = prevScore > ended.score && s.today;
          const best = Math.max(prevScore, ended.score);
          next.bestDaily = Math.max(s.bestDaily, best);
          next.today = {
            dateKey: ended.dateKey,
            score: best,
            glyphs: keepPrev ? (s.today?.glyphs ?? runGlyphs) : runGlyphs,
            played: true,
            helped: keepPrev ? Boolean(s.today?.helped) || helped : helped,
          };
        }
        return next;
      });
      if (ended.mode === "daily") playWin();
      else playGameOver();
    },
    [helped],
  );

  const runPulse = useCallback(
    async (r: number, c: number) => {
      if (!game || busy || game.over) return;
      const result: PulseResult = pulse(game, r, c);
      if (result.harvested.length === 0) return;
      unlockAudio();
      playTap();
      setTipHint(null);
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
              const tile = board[e.r][e.c];
              if (tile && tile.id === e.id) board[e.r][e.c] = { id: e.id, color: e.to };
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

  const waitHandle = profile.signedIn && !profile.ready;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {waitHandle ? (
        <div className="flex flex-1 items-center justify-center" aria-hidden="true">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-surface" />
        </div>
      ) : null}
      {profile.needsClaim ? (
        <ClaimHandle suggested={profile.suggested} onCheck={profile.check} onSave={profile.save} />
      ) : null}

      {screen === "menu" && !profile.needsClaim && !waitHandle ? (
        <Menu
          stats={stats}
          dailyN={dailyN}
          todayPlayed={todayPlayed}
          credits={credits.balance}
          handle={profile.handle}
          onDaily={() => start("daily")}
          onEndless={() => start("endless")}
          onHelp={() => setScreen("help")}
          onRanking={() => setScreen("ranking")}
          onSettings={() => setScreen("settings")}
          onMute={() => {
            const next = !stats.muted;
            persist({ muted: next });
            unlockAudio();
            setMuted(next);
          }}
        />
      ) : null}

      {screen === "help" && !profile.needsClaim && !waitHandle ? (
        <Help
          onClose={() => {
            persist({ seenHowTo: true, seenTutorial: true });
            setScreen("menu");
          }}
        />
      ) : null}

      {screen === "ranking" && !profile.needsClaim && !waitHandle ? (
        <Ranking onClose={() => setScreen("menu")} handle={profile.handle} />
      ) : null}
      {screen === "settings" && !profile.needsClaim && !waitHandle ? (
        <Settings
          onClose={() => setScreen("menu")}
          credits={credits.balance}
          signedIn={credits.signedIn}
          busy={credits.busy}
          onBuy={credits.buy}
          handle={profile.handle}
          onCheckHandle={profile.check}
          onSaveHandle={profile.save}
        />
      ) : null}

      {screen === "play" && game && tutorial && !profile.needsClaim && !waitHandle ? (
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

      {screen === "play" && game && !tutorial && !profile.needsClaim && !waitHandle ? (
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
          hint={
            tipHint && !preview && !busy && !game.over
              ? tipHint
              : nudge && game.moves === 0 && !preview && !busy && !game.over
                ? bestTap(game.board)
                : null
          }
          coach={nudge && game.moves === 0 && !game.over ? t.coach : null}
          credits={credits.balance}
          tipBusy={credits.busy}
          onBack={() => {
            cancelRef.current = true;
            setScreen("menu");
            setGame(null);
          }}
          onCellDown={onCellDown}
          onCellUp={onCellUp}
          onCancel={() => {
            if (!busy) setPreview(null);
          }}
          onMute={() => {
            const next = !stats.muted;
            persist({ muted: next });
            setMuted(next);
          }}
          onTip={async () => {
            if (!game || game.over || busy || credits.busy) return;
            if (tipHint) return;
            if (credits.balance < 1) {
              setScreen("settings");
              return;
            }
            const cell = bestTap(game.board);
            if (!cell) return;
            const res = await credits.spend("tip");
            if (!res.ok) return;
            setHelped(true);
            setTipHint(cell);
          }}
        >
          <ResultCard
            game={game}
            stats={stats}
            shareMsg={shareMsg}
            glyphs={glyphs}
            helped={helped}
            onRetry={() => start(game.mode)}
            onBack={() => {
              cancelRef.current = true;
              setScreen("menu");
              setGame(null);
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
              setShareMsg(res === "copied" ? t.copied : res === "shared" ? t.shared : t.shareFail);
              setTimeout(() => setShareMsg(null), 1600);
            }}
          />
        </Play>
      ) : null}
    </main>
  );
}
