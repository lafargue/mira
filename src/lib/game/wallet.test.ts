import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { costFor, STARTING_CREDITS, TIP_COST } from "./wallet.ts";

describe("wallet rules", () => {
  it("starting grant is enough to try a few tips", () => {
    assert.equal(STARTING_CREDITS, 5);
    assert.equal(TIP_COST, 1);
    assert.ok(STARTING_CREDITS >= TIP_COST * 3);
  });

  it("tip costs one and grants cost nothing to spend", () => {
    assert.equal(costFor("tip"), 1);
    assert.equal(costFor("grant"), 0);
  });
});
