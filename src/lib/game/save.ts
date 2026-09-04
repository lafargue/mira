const KEY = "mira-save-v1";
const SAVE_VERSION = 1;

export type DailyRecord = {
  dateKey: string;
  score: number;
  glyphs: number[];
  played: boolean;
  helped?: boolean;
  /** Best unhelped run today. Published. Independent of `score` (which may be a helped personal best). */
  cleanScore?: number;
  cleanGlyphs?: number[];
};

export type Stats = {
  version: number;
  bestEndless: number;
  bestDaily: number;
  bestCombo: number;
  games: number;
  streak: number;
  lastDaily: string | null;
  today: DailyRecord | null;
  muted: boolean;
  seenHowTo: boolean;
  seenTutorial: boolean;
};

const DEFAULTS: Stats = {
  version: SAVE_VERSION,
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
};

function canStore(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function loadStats(): Stats {
  if (!canStore()) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return { ...DEFAULTS, ...parsed, version: SAVE_VERSION };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveStats(stats: Stats): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...stats, version: SAVE_VERSION }));
  } catch {
    /* private mode / quota */
  }
}

export function streakAfterPlay(stats: Stats, dateKey: string): number {
  if (stats.lastDaily === dateKey) return stats.streak;
  if (!stats.lastDaily) return 1;
  const prev = new Date(`${stats.lastDaily}T00:00:00Z`);
  const cur = new Date(`${dateKey}T00:00:00Z`);
  const diff = (cur.getTime() - prev.getTime()) / 86400000;
  if (diff === 1) return stats.streak + 1;
  return 1;
}

export function cleanScoreOf(today: DailyRecord | null | undefined): number {
  if (!today?.played) return 0;
  if (typeof today.cleanScore === "number") return today.cleanScore;
  return today.helped ? 0 : today.score;
}

export function cleanGlyphsOf(today: DailyRecord | null | undefined): number[] {
  if (!today?.played) return [];
  if (today.cleanGlyphs?.length) return today.cleanGlyphs;
  if (!today.helped) return today.glyphs ?? [];
  return [];
}

/** Fold a finished daily run into today's record. Helped personal bests never erase a clean publishable score. */
export function applyDailyFinish(
  prev: DailyRecord | null | undefined,
  dateKey: string,
  score: number,
  glyphs: number[],
  helped: boolean,
): DailyRecord {
  const same = prev?.dateKey === dateKey ? prev : null;
  const prevScore = same?.score ?? 0;
  const prevClean = cleanScoreOf(same);
  const prevCleanGlyphs = cleanGlyphsOf(same);

  const cleanScore = helped ? prevClean : Math.max(prevClean, score);
  const cleanGlyphs = helped ? prevCleanGlyphs : score >= prevClean ? glyphs : prevCleanGlyphs;

  const nextScore = Math.max(prevScore, score);
  const keepPrev = prevScore > score;
  let nextHelped: boolean;
  if (score > prevScore) nextHelped = helped;
  else if (score === prevScore) nextHelped = helped ? Boolean(same?.helped) : false;
  else nextHelped = Boolean(same?.helped);

  return {
    dateKey,
    score: nextScore,
    glyphs: keepPrev ? (same?.glyphs ?? glyphs) : glyphs,
    played: true,
    helped: nextHelped,
    cleanScore,
    cleanGlyphs,
  };
}
