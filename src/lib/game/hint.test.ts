import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateTap, harvestFrom, harvestScore, type Board, type Tile } from "./engine.ts";
import { bestTap } from "./hint.ts";

const SIZE = 6;

function tile(id: number, color: 0 | 1 | 2): Tile {
  return { id, color };
}

function boardFrom(colors: number[][]): Board {
  return colors.map((row, r) => row.map((c, col) => tile(r * SIZE + col + 1, c as 0 | 1 | 2)));
}

describe("tip lookahead", () => {
  // Cyclic field (no 4-in-a-line) with a fat cruz of 1s at bottom-left
  // and a 2-tap that evolves the 0 into a Mira of 1s.
  const board = boardFrom([
    [0, 1, 2, 0, 1, 2],
    [1, 2, 0, 1, 2, 0],
    [2, 0, 1, 2, 0, 1],
    [0, 1, 2, 0, 1, 2],
    [1, 2, 0, 1, 2, 0],
    [1, 1, 1, 0, 2, 2],
  ]);

  it("a Halo cruz scores less than a small tap that evolves a Mira", () => {
    const halo = harvestFrom(board, 5, 0);
    assert.equal(halo.harvested.length, 4);
    const haloVal = evaluateTap(board, 5, 0);
    assert.equal(haloVal.mira, 0);
    assert.equal(haloVal.frontier, 0);
    assert.equal(haloVal.score, harvestScore(4, 1));

    const mira = evaluateTap(board, 5, 4);
    assert.ok(mira.harvested < halo.harvested.length);
    assert.ok(mira.mira >= 4);
    assert.ok(mira.frontier >= 4);
    assert.ok(mira.score > haloVal.score);
  });

  it("picks the frontier that makes a Mira, not the biggest cruz", () => {
    const pick = bestTap(board);
    assert.deepEqual(pick, { r: 5, c: 4 });
  });

  it("prefers evolving a wall into a 3-line over a fatter cruz", () => {
    const setupBoard = boardFrom([
      [0, 1, 2, 0, 1, 2],
      [1, 2, 0, 1, 2, 0],
      [2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2],
      [1, 1, 1, 2, 0, 2],
      [2, 0, 1, 1, 2, 0],
    ]);
    const halo = harvestFrom(setupBoard, 4, 1);
    assert.equal(halo.harvested.length, 4);
    const haloVal = evaluateTap(setupBoard, 4, 1);
    assert.equal(haloVal.mira, 0);
    assert.equal(haloVal.frontier, 0);

    const wallTap = evaluateTap(setupBoard, 5, 0);
    assert.equal(wallTap.harvested, 1);
    assert.ok(wallTap.setup >= 3);
    assert.ok(wallTap.follow >= 3);

    const pick = bestTap(setupBoard);
    assert.ok(pick);
    const picked = evaluateTap(setupBoard, pick.r, pick.c);
    assert.ok(picked.harvested < 4, "should not pick the Halo cruz");
    assert.ok(picked.setup >= 3);
    assert.ok(!(pick.r === 4 && (pick.c === 1 || pick.c === 2)));
  });
});
