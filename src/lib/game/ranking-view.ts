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

/** Prefer the claimed handle; else a stored username; never a Google full name. */
export function displayHandle(
  profileHandle: string | null | undefined,
  userId: string,
  stored = "",
): string {
  const p = (profileHandle ?? "").trim();
  if (p) return p.length > 16 ? `${p.slice(0, 15)}…` : p;
  const s = stored.trim();
  if (s && !/\s/.test(s) && s.length <= 16) return s;
  return fallbackHandle(userId);
}

/** Merge a local (unpublished) score into the public board so the list is never blank. */
export function visibleBoard(
  rows: BoardRow[],
  localScore: number,
  signedIn: boolean,
  opts: { hideLocal?: boolean; youHandle?: string } = {},
): VisibleRow[] {
  let out: VisibleRow[] = rows.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    score: r.score,
    isYou: r.isYou,
    pending: false,
  }));
  if (opts.hideLocal) {
    out = out.filter((r) => !r.isYou);
    return out.map((r, i) => ({ ...r, rank: i + 1 }));
  }
  if (localScore <= 0 || out.some((r) => r.isYou)) return out;
  const you = (opts.youHandle ?? "").trim() || "Tú";
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
