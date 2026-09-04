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
  it("uses the claimed alias when present", () => {
    assert.equal(displayHandle("ana", "user-1"), "ana");
    assert.equal(displayHandle("jaime32", "abc", "Jaime Martínez Lafargue"), "jaime32");
  });

  it("keeps the published score name so the board is not Mira-XXXX (screenshot regression)", () => {
    assert.equal(displayHandle(null, "u2", "Montse Ferrando"), "Montse Ferrando");
    assert.equal(displayHandle(null, "abc", "Jaime Martínez Lafargue"), "Jaime Martínez Lafargue");
    assert.equal(displayHandle(null, "abc", "Mira-OLD"), "Mira-OLD");
    assert.equal(displayHandle("   ", "abc", ""), fallbackHandle("abc"));
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

  it("never withdraws just because localStorage still has a helped 21060 (screenshot after republish)", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 21060, glyphs: [1], played: true, helped: true, cleanScore: 0 },
      "2026-09-04",
    );
    assert.equal(plan.action, "none");
  });

  it("submits a clean-only day", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 13760, glyphs: [3], played: true, helped: false, cleanScore: 13760, cleanGlyphs: [3] },
      "2026-09-04",
    );
    assert.deepEqual(plan, { action: "submit", score: 13760, glyphs: [3] });
  });

  it("legacy helped without cleanScore does not publish 21060 and does not delete the board", () => {
    const plan = dailySyncPlan(
      { dateKey: "2026-09-04", score: 21060, glyphs: [1], played: true, helped: true },
      "2026-09-04",
    );
    assert.equal(plan.action, "none");
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
