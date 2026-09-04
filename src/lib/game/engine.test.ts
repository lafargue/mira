import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CASCADE_RUN,
  COLOR_COUNT,
  DAILY_MOVES,
  PRESSURE_MAX,
  SIZE,
  applyPulse,
  comboName,
  createGame,
  findCascadeRuns,
  harvestFrom,
  harvestScore,
  nextColor,
  pressureDelta,
  pulse,
  pulseGlyph,
  type Board,
  type Tile,
} from "./engine.ts";
import { COMBO_GUIDE } from "./combos.ts";
import { dailyNumber, dailySeed, hashString, makeRng, utcDateKey } from "./rng.ts";
import { GLYPH_GUIDE, glyphChar, renderGlyphGrid, renderGlyphRow } from "./share.ts";
import { streakAfterPlay, type Stats } from "./save.ts";
import { displayHandle, fallbackHandle, visibleBoard } from "./ranking-view.ts";

function tile(id: number, color: 0 | 1 | 2): Tile {
  return { id, color };
}

function boardFrom(colors: number[][]): Board {
  return colors.map((row, r) => row.map((c, col) => tile(r * SIZE + col + 1, c as 0 | 1 | 2)));
}

describe("core rules", () => {
  it("harvests consecutive same color in four directions and stops at a wall", () => {
    const b = boardFrom([
      [1, 1, 1, 1, 1, 1],
      [2, 2, 0, 2, 2, 2],
      [2, 0, 0, 0, 1, 2],
      [2, 2, 0, 2, 2, 2],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 2, 1, 1, 1],
    ]);
    const { harvested, walls } = harvestFrom(b, 2, 2);
    const keys = harvested.map((h) => `${h.r},${h.c}`).sort();
    assert.deepEqual(keys, ["1,2", "2,1", "2,2", "2,3", "3,2"]);
    const wallKeys = walls.map((w) => `${w.r},${w.c}`).sort();
    assert.deepEqual(wallKeys, ["0,2", "2,0", "2,4", "4,2"]);
  });

  it("cycles wall colors", () => {
    assert.equal(nextColor(0), 1);
    assert.equal(nextColor(1), 2);
    assert.equal(nextColor(2), 0);
  });

  it("detects consecutive cascade runs of 4+", () => {
    const b = boardFrom([
      [0, 1, 2, 0, 1, 2],
      [0, 0, 0, 0, 1, 2],
      [1, 2, 0, 1, 2, 0],
      [2, 1, 2, 0, 1, 2],
      [0, 2, 1, 2, 0, 1],
      [1, 0, 2, 1, 2, 0],
    ]);
    const run = findCascadeRuns(b);
    assert.ok(run.length >= CASCADE_RUN);
    assert.ok(run.every((h) => h.r === 1 && h.color === 0));
  });

  it("scores quadratically and names combos", () => {
    assert.equal(harvestScore(3, 1), 90);
    assert.equal(harvestScore(4, 2), 320);
    assert.equal(comboName(1, 1), "Pulso");
    assert.equal(comboName(4, 1), "Halo");
    assert.equal(comboName(5, 1), "Iris");
    assert.equal(comboName(7, 1), "Iris");
    assert.equal(comboName(3, 2), "Mira");
  });

  it("combo guide covers every named play and lists points", () => {
    const names = new Set(COMBO_GUIDE.map((c) => c.name));
    for (let n = 1; n <= 10; n++) {
      assert.ok(names.has(comboName(n, 1)), `missing ${comboName(n, 1)} for n=${n}`);
    }
    assert.ok(names.has(comboName(4, 2)));
    assert.equal(COMBO_GUIDE.find((c) => c.name === "Iris")?.pts, "250");
    assert.ok(!names.has("Nova"));
    assert.match(COMBO_GUIDE.find((c) => c.name === "Mira")?.pts ?? "", /320/);
  });

  it("a settled board cannot host a 6+ cross tap", () => {
    for (let seed = 1; seed <= 80; seed++) {
      const game = createGame("endless", seed * 17);
      assert.equal(findCascadeRuns(game.board).length, 0);
      let max = 0;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          max = Math.max(max, harvestFrom(game.board, r, c).harvested.length);
        }
      }
      assert.ok(max <= 5, `seed ${seed} max harvest ${max}`);
    }
  });

  it("pressure punishes duds and rewards big harvests", () => {
    assert.equal(pressureDelta(1, 0), 3);
    assert.equal(pressureDelta(2, 0), 2);
    assert.equal(pressureDelta(3, 0), 1);
    assert.equal(pressureDelta(4, 0), 1);
    assert.equal(pressureDelta(5, 0), 0);
    assert.equal(pressureDelta(4, 1), -1);
  });
});

describe("pulse + gravity", () => {
  it("clears, evolves the wall, then refills a full board", () => {
    const game = createGame("endless", 42);
    const r = 2;
    const c = 2;
    const origin = game.board[r][c];
    assert.ok(origin);
    const result = pulse(game, r, c);
    assert.ok(result.harvested.length >= 1);
    assert.equal(result.harvested[0]?.id, origin.id);
    const occupied = result.board.flat().filter(Boolean).length;
    assert.equal(occupied, SIZE * SIZE);
    assert.ok(result.spawns.length >= 1);
  });

  it("same seed produces the same opening board", () => {
    const a = createGame("daily", 99, "2026-08-28");
    const b = createGame("daily", 99, "2026-08-28");
    const colorsA = a.board.map((row) => row.map((t) => t!.color).join("")).join("|");
    const colorsB = b.board.map((row) => row.map((t) => t!.color).join("")).join("|");
    assert.equal(colorsA, colorsB);
  });

  it("daily games end after 12 pulses", () => {
    let game = createGame("daily", 7, "2026-08-28");
    for (let i = 0; i < DAILY_MOVES; i++) {
      assert.equal(game.over, false);
      const result = pulse(game, 0, 0);
      game = applyPulse(game, result);
    }
    assert.equal(game.over, true);
    assert.equal(game.moves, DAILY_MOVES);
  });

  it("endless games end when pressure hits the cap on a dud-ish pulse", () => {
    let game = createGame("endless", 11);
    game = { ...game, pressure: PRESSURE_MAX - 1 };
    let guard = 0;
    while (!game.over && guard++ < 80) {
      let picked = { r: 0, c: 0 };
      let best = 99;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const n = harvestFrom(game.board, r, c).harvested.length;
          if (n < best) {
            best = n;
            picked = { r, c };
          }
        }
      }
      const result = pulse(game, picked.r, picked.c);
      game = applyPulse(game, result);
    }
    assert.equal(game.over, true);
    assert.ok(game.pressure >= PRESSURE_MAX - 1);
  });
});

describe("daily identity + share", () => {
  it("hashes dates stably and numbers days from the epoch", () => {
    assert.equal(dailyNumber("2026-08-28"), 1);
    assert.equal(dailyNumber("2026-08-29"), 2);
    assert.equal(dailySeed("2026-08-28"), hashString("mira-2026-08-28"));
    assert.equal(utcDateKey(new Date("2026-08-28T23:30:00Z")), "2026-08-28");
    assert.ok(makeRng(1).next() !== makeRng(2).next());
  });

  it("renders a two-line share glyph", () => {
    const text = renderGlyphRow([0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 1, 2]);
    const lines = text.split("\n");
    assert.equal(lines.length, 2);
    assert.equal([...lines[0]!].length, 6);
    assert.equal(glyphChar(0), "□");
    assert.equal(glyphChar(1), "■");
    assert.equal(glyphChar(4), "♦");
    assert.equal(GLYPH_GUIDE[0]?.name, "Pulso");
    assert.equal(GLYPH_GUIDE[0]?.glyph, "□");
    assert.equal(renderGlyphGrid([0, 4]).includes(" "), true);
    assert.equal(GLYPH_GUIDE.length, 5);
    assert.equal(GLYPH_GUIDE[4]?.name, "Mira");
    assert.equal(
      pulseGlyph({
        harvested: [{ r: 0, c: 0, id: 1, color: 0 }],
        cascades: [{ harvested: [], falls: [], spawns: [], chain: 2, score: 10 }],
      } as never),
      4,
    );
  });

  it("keeps a streak only across consecutive UTC days", () => {
    const base: Stats = {
      version: 1,
      bestEndless: 0,
      bestDaily: 0,
      bestCombo: 0,
      games: 0,
      streak: 4,
      lastDaily: "2026-08-27",
      today: null,
      muted: false,
      seenHowTo: true,
      seenTutorial: true,
    };
    assert.equal(streakAfterPlay(base, "2026-08-28"), 5);
    assert.equal(streakAfterPlay(base, "2026-08-29"), 1);
    assert.equal(streakAfterPlay({ ...base, lastDaily: "2026-08-28" }, "2026-08-28"), 4);
  });
});

describe("balance sanity", () => {
  it("random endless runs last long enough to feel like one more try", () => {
    const lengths: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const rng = makeRng(seed * 13);
      let game = createGame("endless", seed * 997);
      let guard = 0;
      while (!game.over && guard++ < 80) {
        const r = Math.floor(rng.next() * SIZE);
        const c = Math.floor(rng.next() * SIZE);
        game = applyPulse(game, pulse(game, r, c));
      }
      lengths.push(game.moves);
    }
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    assert.ok(avg >= 4, `avg moves ${avg} too short`);
    assert.ok(avg <= 35, `avg moves ${avg} too long`);
    assert.equal(COLOR_COUNT, 3);
  });
});

describe("ranking view", () => {
  it("inserts a local score so the board is never blank", () => {
    const rows = visibleBoard(
      [
        { handle: "Mira-AAAA", score: 200, isYou: false },
        { handle: "Mira-BBBB", score: 50, isYou: false },
      ],
      120,
      false,
    );
    assert.equal(rows.length, 3);
    assert.equal(rows[1]?.handle, "Tú");
    assert.equal(rows[1]?.rank, 2);
    assert.equal(rows[1]?.pending, true);
    assert.equal(rows[1]?.isYou, true);
  });

  it("does not duplicate when the server already marked isYou", () => {
    const rows = visibleBoard([{ handle: "Mira-XXXX", score: 80, isYou: true }], 80, true);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.pending, false);
  });

  it("does not inject a helped local mark when hideLocal is set", () => {
    const rows = visibleBoard([{ handle: "Mira-QR7G", score: 8220, isYou: false }], 21060, true, {
      hideLocal: true,
      youHandle: "Jaime",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.handle, "Mira-QR7G");
    assert.ok(!rows.some((r) => r.score === 21060));
  });

  it("keeps a published clean isYou row when the local best used help", () => {
    const rows = visibleBoard(
      [
        { handle: "Jaime", score: 13760, isYou: true },
        { handle: "Mira-QR7G", score: 8220, isYou: false },
      ],
      21060,
      true,
      { hideLocal: true, youHandle: "Jaime" },
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.handle, "Jaime");
    assert.equal(rows[0]?.score, 13760);
    assert.ok(!rows.some((r) => r.score === 21060));
  });

  it("uses the claimed handle for an unpublished local row", () => {
    const rows = visibleBoard([], 90, true, { youHandle: "Jaime" });
    assert.equal(rows[0]?.handle, "Jaime");
    assert.equal(rows[0]?.isYou, true);
  });

  it("prefers the claimed handle and keeps a published score name", () => {
    assert.equal(displayHandle("ana", "user-1"), "ana");
    assert.equal(displayHandle(null, "abc", "Mira-OLD"), "Mira-OLD");
    assert.equal(displayHandle(null, "abc", "Jaime Martínez Lafargue"), "Jaime Martínez Lafargue");
    assert.equal(displayHandle("   ", "abc", ""), fallbackHandle("abc"));
    assert.match(fallbackHandle("abc"), /^Mira-/);
  });
});
