import { makeRng, type Rng } from "./rng.ts";

export const SIZE = 6;
export const COLOR_COUNT = 3;
export const CASCADE_RUN = 4;
export const DAILY_MOVES = 12;
export const PRESSURE_MAX = 12;

export type Color = 0 | 1 | 2;
export type Mode = "daily" | "endless";
export type Tile = { id: number; color: Color };
export type Board = (Tile | null)[][];
export type Pos = { r: number; c: number };

export type Harvested = Pos & { id: number; color: Color };
export type Evolved = Pos & { id: number; from: Color; to: Color };
export type Fall = { id: number; fromR: number; toR: number; c: number };
export type Spawn = Pos & { id: number; color: Color };

export type CascadeStep = {
  harvested: Harvested[];
  falls: Fall[];
  spawns: Spawn[];
  chain: number;
  score: number;
  board: Board;
};

export type PulseResult = {
  row: number;
  col: number;
  harvested: Harvested[];
  evolved: Evolved[];
  falls: Fall[];
  spawns: Spawn[];
  cascades: CascadeStep[];
  scoreDelta: number;
  comboName: string;
  pressureDelta: number;
  boardAfterTap: Board;
  board: Board;
  nextId: number;
  rngState: number;
};

export type GameState = {
  mode: Mode;
  board: Board;
  nextId: number;
  rngState: number;
  score: number;
  moves: number;
  pressure: number;
  bestCombo: number;
  over: boolean;
  lastPulse: PulseResult | null;
  dateKey: string | null;
};

const DIRS: Array<[number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

export function nextColor(c: Color): Color {
  return ((c + 1) % COLOR_COUNT) as Color;
}

export function comboName(n: number, chain: number): string {
  if (chain > 1) return "Mira";
  // Stable boards never have 4-in-a-line (that would already be a Mira),
  // so a cross tap is at most 3+3−1 = 5.
  if (n >= 5) return "Iris";
  if (n >= 4) return "Halo";
  if (n >= 3) return "Acorde";
  if (n >= 2) return "Eco";
  return "Pulso";
}

export function harvestScore(n: number, chain: number): number {
  return n * n * 10 * chain;
}

export function pressureDelta(harvested: number, cascadeCount: number): number {
  let p = 1;
  if (harvested <= 1) p += 2;
  else if (harvested === 2) p += 1;
  else if (harvested >= 5) p -= harvested - 4;
  p -= cascadeCount * 2;
  return p;
}

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array<Tile | null>(SIZE).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

export function harvestFrom(board: Board, r: number, c: number): {
  harvested: Harvested[];
  walls: Pos[];
} {
  const tile = board[r][c];
  if (!tile) return { harvested: [], walls: [] };
  const color = tile.color;
  const harvested: Harvested[] = [{ r, c, id: tile.id, color }];
  const seen = new Set<string>([`${r},${c}`]);
  const walls: Pos[] = [];

  for (const [dr, dc] of DIRS) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc) && board[nr][nc]?.color === color) {
      const t = board[nr][nc]!;
      const key = `${nr},${nc}`;
      if (!seen.has(key)) {
        seen.add(key);
        harvested.push({ r: nr, c: nc, id: t.id, color });
      }
      nr += dr;
      nc += dc;
    }
    if (inBounds(nr, nc) && board[nr][nc]) {
      walls.push({ r: nr, c: nc });
    }
  }
  return { harvested, walls };
}

export function findCascadeRuns(board: Board): Harvested[] {
  const marked = new Map<string, Harvested>();

  const markRun = (cells: Harvested[]) => {
    if (cells.length < CASCADE_RUN) return;
    for (const cell of cells) marked.set(`${cell.r},${cell.c}`, cell);
  };

  for (let r = 0; r < SIZE; r++) {
    let i = 0;
    while (i < SIZE) {
      const t = board[r][i];
      if (!t) {
        i++;
        continue;
      }
      const run: Harvested[] = [{ r, c: i, id: t.id, color: t.color }];
      let j = i + 1;
      while (j < SIZE && board[r][j]?.color === t.color) {
        const u = board[r][j]!;
        run.push({ r, c: j, id: u.id, color: u.color });
        j++;
      }
      markRun(run);
      i = j;
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let i = 0;
    while (i < SIZE) {
      const t = board[i][c];
      if (!t) {
        i++;
        continue;
      }
      const run: Harvested[] = [{ r: i, c, id: t.id, color: t.color }];
      let j = i + 1;
      while (j < SIZE && board[j][c]?.color === t.color) {
        const u = board[j][c]!;
        run.push({ r: j, c, id: u.id, color: u.color });
        j++;
      }
      markRun(run);
      i = j;
    }
  }

  return [...marked.values()];
}

function applyGravity(board: Board): Fall[] {
  const falls: Fall[] = [];
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      const tile = board[r][c];
      if (!tile) continue;
      if (write !== r) {
        falls.push({ id: tile.id, fromR: r, toR: write, c });
        board[write][c] = tile;
        board[r][c] = null;
      }
      write--;
    }
  }
  return falls;
}

function refill(board: Board, rng: Rng, nextIdRef: { n: number }): Spawn[] {
  const spawns: Spawn[] = [];
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE; r++) {
      if (!board[r][c]) {
        const color = rng.color();
        const tile: Tile = { id: nextIdRef.n++, color };
        board[r][c] = tile;
        spawns.push({ r, c, id: tile.id, color });
      }
    }
  }
  return spawns;
}

function hasLongRun(board: Board): boolean {
  return findCascadeRuns(board).length > 0;
}

function maxHarvestOnBoard(board: Board): number {
  let max = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) continue;
      max = Math.max(max, harvestFrom(board, r, c).harvested.length);
    }
  }
  return max;
}

export function generateBoard(rng: Rng, nextIdRef: { n: number }): Board {
  for (let attempt = 0; attempt < 80; attempt++) {
    const board = emptyBoard();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        board[r][c] = { id: nextIdRef.n++, color: rng.color() };
      }
    }
    if (!hasLongRun(board) && maxHarvestOnBoard(board) >= 2) return board;
  }
  const board = emptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      board[r][c] = { id: nextIdRef.n++, color: rng.color() };
    }
  }
  return board;
}

export function pulse(state: GameState, row: number, col: number): PulseResult {
  const board = cloneBoard(state.board);
  const origin = board[row][col];
  if (!origin) {
    return {
      row,
      col,
      harvested: [],
      evolved: [],
      falls: [],
      spawns: [],
      cascades: [],
      scoreDelta: 0,
      comboName: "Pulso",
      pressureDelta: 0,
      boardAfterTap: board,
      board,
      nextId: state.nextId,
      rngState: state.rngState,
    };
  }

  const rng = makeRng(state.rngState);
  const nextIdRef = { n: state.nextId };

  const { harvested, walls } = harvestFrom(board, row, col);
  const harvestedIds = new Set(harvested.map((h) => h.id));

  const evolved: Evolved[] = [];
  for (const w of walls) {
    const t = board[w.r][w.c];
    if (!t || harvestedIds.has(t.id)) continue;
    const to = nextColor(t.color);
    evolved.push({ r: w.r, c: w.c, id: t.id, from: t.color, to });
    board[w.r][w.c] = { id: t.id, color: to };
  }

  for (const h of harvested) {
    if (board[h.r][h.c]?.id === h.id) board[h.r][h.c] = null;
  }

  const falls = applyGravity(board);
  const spawns = refill(board, rng, nextIdRef);
  const boardAfterTap = cloneBoard(board);

  const cascades: CascadeStep[] = [];
  let chain = 1;
  let guard = 0;
  while (guard++ < 12) {
    const run = findCascadeRuns(board);
    if (run.length === 0) break;
    chain += 1;
    for (const h of run) {
      if (board[h.r][h.c]?.id === h.id) board[h.r][h.c] = null;
    }
    const cFalls = applyGravity(board);
    const cSpawns = refill(board, rng, nextIdRef);
    cascades.push({
      harvested: run,
      falls: cFalls,
      spawns: cSpawns,
      chain,
      score: harvestScore(run.length, chain),
      board: cloneBoard(board),
    });
  }

  const tapScore = harvestScore(harvested.length, 1);
  const cascadeScore = cascades.reduce((s, c) => s + c.score, 0);
  const scoreDelta = tapScore + cascadeScore;
  const pDelta = pressureDelta(harvested.length, cascades.length);

  return {
    row,
    col,
    harvested,
    evolved,
    falls,
    spawns,
    cascades,
    scoreDelta,
    comboName: comboName(harvested.length, cascades.length > 0 ? 2 : 1),
    pressureDelta: pDelta,
    boardAfterTap,
    board,
    nextId: nextIdRef.n,
    rngState: rng.getState(),
  };
}

export function applyPulse(state: GameState, result: PulseResult): GameState {
  if (state.over || result.harvested.length === 0) return state;
  const moves = state.moves + 1;
  let pressure = state.pressure;
  if (state.mode === "endless") {
    pressure = Math.max(0, Math.min(PRESSURE_MAX, pressure + result.pressureDelta));
  }
  const over =
    state.mode === "daily"
      ? moves >= DAILY_MOVES
      : pressure >= PRESSURE_MAX && result.pressureDelta > 0;

  return {
    ...state,
    board: result.board,
    nextId: result.nextId,
    rngState: result.rngState,
    score: state.score + result.scoreDelta,
    moves,
    pressure,
    bestCombo: Math.max(state.bestCombo, result.harvested.length),
    over,
    lastPulse: result,
  };
}

export function createGame(mode: Mode, seed: number, dateKey: string | null = null): GameState {
  const rng = makeRng(seed);
  const nextIdRef = { n: 1 };
  const board = generateBoard(rng, nextIdRef);
  return {
    mode,
    board,
    nextId: nextIdRef.n,
    rngState: rng.getState(),
    score: 0,
    moves: 0,
    pressure: 0,
    bestCombo: 0,
    over: false,
    lastPulse: null,
    dateKey,
  };
}

export function previewHarvest(board: Board, r: number, c: number): {
  harvested: Harvested[];
  walls: Pos[];
} {
  return harvestFrom(board, r, c);
}

/** Intensity 0–4 for share glyphs (1 harvested → 0, 5+ or cascade → 4). */
export function pulseGlyph(result: PulseResult): number {
  if (result.cascades.length > 0) return 4;
  if (result.harvested.length >= 5) return 3;
  if (result.harvested.length >= 3) return 2;
  if (result.harvested.length >= 2) return 1;
  return 0;
}
