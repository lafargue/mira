const KEY = "mira-save-v1";
const SAVE_VERSION = 1;

export type DailyRecord = {
  dateKey: string;
  score: number;
  glyphs: number[];
  played: boolean;
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
