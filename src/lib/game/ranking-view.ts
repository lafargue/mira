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

/** Prefer the account name; else the stored handle; else a stable Mira-XXXX code. */
export function displayHandle(
  name: string | null | undefined,
  userId: string,
  stored = "",
): string {
  const n = (name ?? "").trim().replace(/\s+/g, " ");
  if (n) return n.length > 24 ? `${n.slice(0, 23)}…` : n;
  if (stored.trim()) return stored.trim();
  return fallbackHandle(userId);
}

/** Merge a local (unpublished) score into the public board so the list is never blank. */
export function visibleBoard(
  rows: BoardRow[],
  localScore: number,
  signedIn: boolean,
): VisibleRow[] {
  const out: VisibleRow[] = rows.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    score: r.score,
    isYou: r.isYou,
    pending: false,
  }));
  if (localScore <= 0 || out.some((r) => r.isYou)) return out;
  const row: VisibleRow = {
    rank: 0,
    handle: "Tú",
    score: localScore,
    isYou: true,
    pending: !signedIn,
  };
  const at = out.findIndex((r) => localScore > r.score);
  if (at === -1) out.push(row);
  else out.splice(at, 0, row);
  return out.map((r, i) => ({ ...r, rank: i + 1 }));
}
