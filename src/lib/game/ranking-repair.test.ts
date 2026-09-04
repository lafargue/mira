import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ownerCleanRepair } from "./ranking-repair.ts";
import { dailySyncPlan, displayHandle, fallbackHandle, rankingHeadline, visibleBoard } from "./ranking-view.ts";

describe("ownerCleanRepair", () => {
  it("puts back the 13760 for jaime32 on the day it was wiped", () => {
    assert.equal(ownerCleanRepair("jaime32@gmail.com", "2026-09-04", null), 13760);
    assert.equal(ownerCleanRepair("Jaime32@gmail.com", "2026-09-04", 0), 13760);
  });

  it("does not touch anyone else or a day that already has a clean mark", () => {
    assert.equal(ownerCleanRepair("montse@x.com", "2026-09-04", null), null);
    assert.equal(ownerCleanRepair("jaime32@gmail.com", "2026-09-05", null), null);
    assert.equal(ownerCleanRepair("jaime32@gmail.com", "2026-09-04", 13760), null);
  });
});

describe("screenshot 22:36 ranking", () => {
  it("shows 13760 as #1 over Montse 8220 and keeps 21060 off the board", () => {
    const rows = visibleBoard(
      [
        { handle: fallbackHandle("jaime"), score: 13760, isYou: true },
        { handle: fallbackHandle("u2"), score: 8220, isYou: false },
      ],
      21060,
      true,
      { hideLocal: true },
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.score, 13760);
    assert.equal(rows[0]?.rank, 1);
    assert.equal(rows[1]?.score, 8220);
    assert.match(rows[1]?.handle ?? "", /^Mira-/);
    assert.ok(!rows.some((r) => r.handle.includes("Montse")));
    assert.ok(!rows.some((r) => r.score === 21060));
    assert.equal(
      rankingHeadline({ myRank: 1, myScore: 13760, localScore: 21060, helpedToday: true }),
      "place",
    );
  });

  it("does not delete that row when localStorage still says helped 21060", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 21060, glyphs: [], played: true, helped: true },
      "2026-09-04",
    );
    assert.equal(plan.action, "none");
  });

  it("anonymizes Montse until she claims a username", () => {
    assert.equal(displayHandle(null, "u2", "Montse Ferrando"), fallbackHandle("u2"));
    assert.match(fallbackHandle("u2"), /^Mira-/);
  });
});
