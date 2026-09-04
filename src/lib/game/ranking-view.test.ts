import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseHandle } from "./handle.ts";
import {
  dailySyncPlan,
  displayHandle,
  fallbackHandle,
  looksLikePersonName,
  rankingHeadline,
  visibleBoard,
  youTagLabel,
} from "./ranking-view.ts";

describe("displayHandle", () => {
  it("never puts a Google full name on the board", () => {
    assert.equal(displayHandle("ana", "user-1"), "ana");
    assert.equal(displayHandle(null, "abc", "Mira-OLD"), "Mira-OLD");
    assert.equal(displayHandle("   ", "abc", "Jaime Martínez"), fallbackHandle("abc"));
    assert.equal(displayHandle("Jaime Martínez Lafargue", "abc"), fallbackHandle("abc"));
    assert.equal(displayHandle(null, "u2", "Montse Ferrando"), fallbackHandle("u2"));
    assert.match(fallbackHandle("abc"), /^Mira-/);
    assert.equal(looksLikePersonName("Montse Ferrando"), true);
    assert.equal(looksLikePersonName("jaime32"), false);
    assert.equal(parseHandle("Montse Ferrando").ok, false);
  });
});

describe("youTagLabel", () => {
  it("does not print Tú tú", () => {
    assert.equal(youTagLabel("Tú", true, false, "tú", "local"), null);
    assert.equal(youTagLabel("tú", true, false, "Tú", "local"), null);
    assert.equal(youTagLabel("Jaime", true, false, "tú", "local"), "tú");
    assert.equal(youTagLabel("Jaime", false, false, "tú", "local"), null);
  });
});

describe("visibleBoard helped daily", () => {
  it("does not inject a helped 21060 onto the board", () => {
    const rows = visibleBoard([{ handle: "Mira-QR7G", score: 8220, isYou: false }], 21060, true, {
      hideLocal: true,
      youHandle: "jaime32",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.handle, "Mira-QR7G");
    assert.equal(rows[0]?.score, 8220);
    assert.ok(!rows.some((r) => r.score === 21060));
  });

  it("keeps a published clean mark when the local best used a Tip (screenshot 21.060 / 13.760)", () => {
    const rows = visibleBoard(
      [
        { handle: "jaime32", score: 13760, isYou: true },
        { handle: "Mira-QR7G", score: 8220, isYou: false },
      ],
      21060,
      true,
      { hideLocal: true, youHandle: "jaime32" },
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.handle, "jaime32");
    assert.equal(rows[0]?.score, 13760);
    assert.equal(rows[0]?.isYou, true);
    assert.equal(rows[0]?.rank, 1);
    assert.equal(rows[1]?.score, 8220);
    assert.ok(!rows.some((r) => r.score === 21060));
  });

  it("does not duplicate when the server already marked isYou", () => {
    const rows = visibleBoard([{ handle: "jaime32", score: 13760, isYou: true }], 13760, true);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.pending, false);
  });
});

describe("dailySyncPlan", () => {
  it("submits the clean 13760 and never withdraws after a helped 21060", () => {
    const plan = dailySyncPlan(
      {
        dateKey: "2026-09-04",
        score: 21060,
        glyphs: [1],
        played: true,
        helped: true,
        cleanScore: 13760,
        cleanGlyphs: [2],
      },
      "2026-09-04",
    );
    assert.deepEqual(plan, { action: "submit", score: 13760, glyphs: [2] });
  });

  it("withdraws only a helped-only day (nothing clean to keep)", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 21060, glyphs: [1], played: true, helped: true, cleanScore: 0 },
      "2026-09-04",
    );
    assert.equal(plan.action, "withdraw");
  });

  it("submits a clean-only day", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 13760, glyphs: [3], played: true, helped: false, cleanScore: 13760, cleanGlyphs: [3] },
      "2026-09-04",
    );
    assert.deepEqual(plan, { action: "submit", score: 13760, glyphs: [3] });
  });

  it("legacy helped without cleanScore withdraws instead of publishing 21060", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 21060, glyphs: [1], played: true, helped: true },
      "2026-09-04",
    );
    assert.equal(plan.action, "withdraw");
  });
});

describe("rankingHeadline", () => {
  it("shows puesto when a clean mark is on the server even if local best used help", () => {
    assert.equal(
      rankingHeadline({ myRank: 1, myScore: 13760, localScore: 21060, helpedToday: true }),
      "place",
    );
  });

  it("shows marca con ayuda when nothing clean was published", () => {
    assert.equal(
      rankingHeadline({ myRank: null, myScore: null, localScore: 21060, helpedToday: true }),
      "helped-mark",
    );
  });
});
