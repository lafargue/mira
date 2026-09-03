import { SIZE, harvestFrom, type Board, type Pos } from "@/lib/game/engine";

/** The cell that eats the most right now. Ties keep the first one found. */
export function bestTap(board: Board): Pos | null {
  let best: Pos | null = null;
  let bestN = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) continue;
      const n = harvestFrom(board, r, c).harvested.length;
      if (n > bestN) {
        best = { r, c };
        bestN = n;
      }
    }
  }
  return bestN > 0 ? best : null;
}
