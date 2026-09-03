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

/** Points from this tap without lucky refills: cruz + muros + Mira al caer. */
export type TapValue = {
  harvested: number;
  /** Cascade tiles after this fall (known tiles only, no refill). */
  mira: number;
  /** First cascade that includes an evolved wall. */
  frontier: number;
  /** Longest line through an evolved wall after gravity (3 = almost Mira). */
  setup: number;
  /** Biggest cruz you can tap next on that new frontier. */
  follow: number;
  score: number;
};

const EMPTY_TAP: TapValue = {
  harvested: 0,
  mira: 0,
  frontier: 0,
  setup: 0,
  follow: 0,
  score: 0,
};

function runThrough(board: Board, r: number, c: number): number {
  const color = board[r][c]?.color;
  if (color === undefined) return 0;
  let horiz = 1;
  let vert = 1;
  for (let cc = c - 1; cc >= 0 && board[r][cc]?.color === color; cc--) horiz++;
  for (let cc = c + 1; cc < SIZE && board[r][cc]?.color === color; cc++) horiz++;
  for (let rr = r - 1; rr >= 0 && board[rr][c]?.color === color; rr--) vert++;
  for (let rr = r + 1; rr < SIZE && board[rr][c]?.color === color; rr++) vert++;
  return Math.max(horiz, vert);
}

function evolvedCells(board: Board, ids: Set<number>): Pos[] {
  const out: Pos[] = [];
  if (ids.size === 0) return out;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = board[r][c];
      if (t && ids.has(t.id)) out.push({ r, c });
    }
  }
  return out;
}

function frontierGroup(board: Board, cells: Pos[]): Pos[] {
  const seen = new Set<string>();
  const out: Pos[] = [];
  const add = (r: number, c: number) => {
    const key = `${r},${c}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ r, c });
  };
  for (const p of cells) {
    const color = board[p.r][p.c]?.color;
    if (color === undefined) continue;
    add(p.r, p.c);
    for (let cc = p.c - 1; cc >= 0 && board[p.r][cc]?.color === color; cc--) add(p.r, cc);
    for (let cc = p.c + 1; cc < SIZE && board[p.r][cc]?.color === color; cc++) add(p.r, cc);
    for (let rr = p.r - 1; rr >= 0 && board[rr][p.c]?.color === color; rr--) add(rr, p.c);
    for (let rr = p.r + 1; rr < SIZE && board[rr][p.c]?.color === color; rr++) add(rr, p.c);
  }
  return out;
}

/** Harvest, evolve each wall once, gravity. No random refill. */
function settleTap(
  board: Board,
  r: number,
  c: number,
): { harvested: Harvested[]; evolvedIds: Set<number>; board: Board } {
  const next = cloneBoard(board);
  const { harvested, walls } = harvestFrom(next, r, c);
  const harvestedIds = new Set(harvested.map((h) => h.id));
  const evolvedIds = new Set<number>();
  const seenWall = new Set<string>();
  for (const w of walls) {
    const key = `${w.r},${w.c}`;
    if (seenWall.has(key)) continue;
    seenWall.add(key);
    const t = next[w.r][w.c];
    if (!t || harvestedIds.has(t.id)) continue;
    next[w.r][w.c] = { id: t.id, color: nextColor(t.color) };
    evolvedIds.add(t.id);
  }
  for (const h of harvested) {
    if (next[h.r][h.c]?.id === h.id) next[h.r][h.c] = null;
  }
  applyGravity(next);
  return { harvested, evolvedIds, board: next };
}

export function evaluateTap(board: Board, r: number, c: number): TapValue {
  if (!board[r][c]) return EMPTY_TAP;
  const settled = settleTap(board, r, c);
  if (settled.harvested.length === 0) return EMPTY_TAP;

  const walls = evolvedCells(settled.board, settled.evolvedIds);
  let setup = 0;
  for (const p of walls) {
    setup = Math.max(setup, runThrough(settled.board, p.r, p.c));
  }
  let follow = 0;
  for (const p of frontierGroup(settled.board, walls)) {
    follow = Math.max(follow, harvestFrom(settled.board, p.r, p.c).harvested.length);
  }

  const next = settled.board;
  let mira = 0;
  let cascadeScore = 0;
  let frontier = 0;
  let chain = 1;
  let guard = 0;
  while (guard++ < 12) {
    const run = findCascadeRuns(next);
    if (run.length === 0) break;
    chain += 1;
    mira += run.length;
    cascadeScore += harvestScore(run.length, chain);
    if (frontier === 0 && run.some((h) => settled.evolvedIds.has(h.id))) {
      frontier = run.length;
    }
    for (const h of run) {
      if (next[h.r][h.c]?.id === h.id) next[h.r][h.c] = null;
    }
    applyGravity(next);
  }

  return {
    harvested: settled.harvested.length,
    mira,
    frontier,
    setup,
    follow,
    score: harvestScore(settled.harvested.length, 1) + cascadeScore,
  };
}

/** Intensity 0–4 for share glyphs (1 harvested → 0, 5+ or cascade → 4). */
export function pulseGlyph(result: PulseResult): number {
  if (result.cascades.length > 0) return 4;
  if (result.harvested.length >= 5) return 3;
  if (result.harvested.length >= 3) return 2;
  if (result.harvested.length >= 2) return 1;
  return 0;
}
