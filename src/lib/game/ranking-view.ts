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
