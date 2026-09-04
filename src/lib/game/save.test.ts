import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyDailyFinish, cleanScoreOf } from "./save.ts";

describe("applyDailyFinish", () => {
  it("keeps a clean 13760 after a higher helped 21060 (screenshot regression)", () => {
    const helped = applyDailyFinish(null, "2026-09-04", 21060, [1, 1, 1], true);
    assert.equal(helped.score, 21060);
    assert.equal(helped.helped, true);
    assert.equal(helped.cleanScore, 0);

    const after = applyDailyFinish(helped, "2026-09-04", 13760, [2, 2, 2], false);
    assert.equal(after.score, 21060);
    assert.equal(after.helped, true);
    assert.equal(after.cleanScore, 13760);
    assert.deepEqual(after.cleanGlyphs, [2, 2, 2]);
    assert.deepEqual(after.glyphs, [1, 1, 1]);
  });

  it("keeps the clean score if the helped run comes second", () => {
    const clean = applyDailyFinish(null, "2026-09-04", 13760, [2], false);
    const after = applyDailyFinish(clean, "2026-09-04", 21060, [1], true);
    assert.equal(after.score, 21060);
    assert.equal(after.helped, true);
    assert.equal(after.cleanScore, 13760);
    assert.deepEqual(after.cleanGlyphs, [2]);
  });

  it("publishes a clean-only day", () => {
    const row = applyDailyFinish(null, "2026-09-04", 13760, [3], false);
    assert.equal(row.helped, false);
    assert.equal(row.cleanScore, 13760);
    assert.equal(cleanScoreOf(row), 13760);
  });

  it("does not invent a clean score from a helped-only day", () => {
    const row = applyDailyFinish(null, "2026-09-04", 21060, [1], true);
    assert.equal(cleanScoreOf(row), 0);
    assert.equal(row.helped, true);
  });

  it("a matching clean run clears the helped flag on the displayed best", () => {
    const helped = applyDailyFinish(null, "2026-09-04", 1000, [1], true);
    const tied = applyDailyFinish(helped, "2026-09-04", 1000, [2], false);
    assert.equal(tied.helped, false);
    assert.equal(tied.cleanScore, 1000);
  });

  it("legacy records without cleanScore still publish when unhelped", () => {
    assert.equal(cleanScoreOf({ dateKey: "2026-09-04", score: 8220, glyphs: [], played: true }), 8220);
    assert.equal(
      cleanScoreOf({ dateKey: "2026-09-04", score: 21060, glyphs: [], played: true, helped: true }),
      0,
    );
  });
});
