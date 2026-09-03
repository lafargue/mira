import { SIZE, evaluateTap, type Board, type Pos, type TapValue } from "./engine.ts";

/** Wall setup counts for Pulso/Eco/Acorde — a Halo is already a fat cruz. */
function setupRank(v: TapValue): number {
  return v.harvested < 4 ? v.setup : 0;
}

function followRank(v: TapValue): number {
  return v.harvested < 4 && v.setup >= 3 ? v.follow : 0;
}

function better(a: TapValue, b: TapValue): boolean {
  if (a.frontier !== b.frontier) return a.frontier > b.frontier;
  if (a.mira !== b.mira) return a.mira > b.mira;
  const aSet = setupRank(a);
  const bSet = setupRank(b);
  if (aSet !== bSet) return aSet > bSet;
  const aFollow = followRank(a);
  const bFollow = followRank(b);
  if (aFollow !== bFollow) return aFollow > bFollow;
  if (a.score !== b.score) return a.score > b.score;
  return a.harvested > b.harvested;
}

/**
 * Best cell to tap now.
 * A wall that evolves into a Mira beats a fatter cruz. A small tap that
 * paints a 3-line on a muro beats a Halo that goes nowhere.
 */
export function bestTap(board: Board): Pos | null {
  let best: Pos | null = null;
  let bestVal: TapValue | null = null;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) continue;
      const v = evaluateTap(board, r, c);
      if (v.harvested === 0) continue;
      if (!bestVal || better(v, bestVal)) {
        best = { r, c };
        bestVal = v;
      }
    }
  }
  return best;
}
