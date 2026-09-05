import { isPublicHandle, publicHandle } from "./handle.ts";
import { cleanGlyphsOf, cleanScoreOf, type DailyRecord } from "./save.ts";

export type BoardRow = {
  handle: string;
  score: number;
  isYou: boolean;
};

export type VisibleRow = {
  rank: number;
  handle: string;
  score: number;
  isYou: boolean;
  pending: boolean;
};

export function fallbackHandle(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0;
  const n = Math.abs(h).toString(36).slice(0, 4).toUpperCase();
  return `Mira-${n}`;
}

/** Claimed alias only. Google full names stay off the board until they pick one. */
export function displayHandle(
  profileHandle: string | null | undefined,
  userId: string,
  stored = "",
): string {
  return publicHandle(profileHandle) ?? (isPublicHandle(stored) ? stored.trim() : fallbackHandle(userId));
}

/** Map a server board. Every player stays; `isYou` is only the viewer. */
export function mapBoardRows(
  rows: Array<{
    user_id: string;
    handle: string;
    score: number;
    profile_handle: string | null;
  }>,
  viewerId: string | null,
): BoardRow[] {
  return rows.map((r) => ({
    handle: displayHandle(r.profile_handle, r.user_id, r.handle),
    score: r.score,
    isYou: Boolean(viewerId) && r.user_id === viewerId,
  }));
}

export function looksLikePersonName(raw: string): boolean {
  return /\s/.test(raw.trim());
}

/** Merge a local (unpublished) score into the public board so the list is never blank. */
export function visibleBoard(
  rows: BoardRow[],
  localScore: number,
  signedIn: boolean,
  opts: { hideLocal?: boolean; youHandle?: string } = {},
): VisibleRow[] {
  const out: VisibleRow[] = rows.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    score: r.score,
    isYou: r.isYou,
    pending: false,
  }));
  if (opts.hideLocal) {
    return out;
  }
  if (localScore <= 0 || out.some((r) => r.isYou)) return out;
  const claimed = publicHandle(opts.youHandle);
  const you = claimed ?? "Tú";
  const row: VisibleRow = {
    rank: 0,
    handle: you,
    score: localScore,
    isYou: true,
    pending: !signedIn,
  };
  const at = out.findIndex((r) => localScore > r.score);
  if (at === -1) out.push(row);
  else out.splice(at, 0, row);
  return out.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function youTagLabel(
  handle: string,
  isYou: boolean,
  pending: boolean,
  you: string,
  local: string,
): string | null {
  if (!isYou) return null;
  const tag = pending ? local : you;
  if (handle.trim().toLowerCase() === tag.trim().toLowerCase()) return null;
  return tag;
}

export type RankingSync =
  | { action: "none" }
  | { action: "submit"; score: number; glyphs: number[] }
  | { action: "withdraw" };

/** Publish a clean mark. Never delete one because a later run used a Tip. */
export function dailySyncPlan(today: DailyRecord | null | undefined, dateKey: string): RankingSync {
  if (!today?.played || today.dateKey !== dateKey) return { action: "none" };
  const clean = cleanScoreOf(today);
  if (clean > 0) {
    return { action: "submit", score: clean, glyphs: cleanGlyphsOf(today) };
  }
  return { action: "none" };
}

export type RankingHeadline = "place" | "helped-mark" | "local-mark" | "empty";

export function rankingHeadline(opts: {
  myRank: number | null | undefined;
  myScore: number | null | undefined;
  localScore: number;
  helpedToday: boolean;
}): RankingHeadline {
  if (opts.myRank && opts.myScore != null) return "place";
  if (opts.localScore > 0 && opts.helpedToday) return "helped-mark";
  if (opts.localScore > 0) return "local-mark";
  return "empty";
}
