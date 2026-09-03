import { SIZE, evaluateTap, type Board, type Pos } from "./engine.ts";

/**
 * Best cell to tap now: most points after walls evolve and tiles fall.
 * A Mira from a frontier change beats a fatter cruz with no cascade.
 */
export function bestTap(board: Board): Pos | null {
  let best: Pos | null = null;
  let bestScore = -1;
  let bestMira = -1;
  let bestN = -1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) continue;
      const v = evaluateTap(board, r, c);
      if (v.harvested === 0) continue;
      const better =
        v.score > bestScore ||
        (v.score === bestScore && v.mira > bestMira) ||
        (v.score === bestScore && v.mira === bestMira && v.harvested > bestN);
      if (better) {
        best = { r, c };
        bestScore = v.score;
        bestMira = v.mira;
        bestN = v.harvested;
      }
    }
  }
  return best;
}