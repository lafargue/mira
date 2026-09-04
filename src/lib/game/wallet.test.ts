import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { costFor, STARTING_CREDITS, TIP_COST, isOwnerEmail, mergedBalance } from "./wallet.ts";

describe("wallet rules", () => {
  it("starting grant is enough to try a few tips", () => {
    assert.equal(STARTING_CREDITS, 5);
    assert.equal(TIP_COST, 1);
    assert.ok(STARTING_CREDITS >= TIP_COST * 3);
  });

  it("tip costs one and grants cost nothing to spend", () => {
    assert.equal(costFor("tip"), 1);
    assert.equal(costFor("grant"), 0);
    assert.equal(costFor("refill"), 0);
    assert.equal(costFor("purchase"), 0);
  });

  it("only jaime32@gmail.com is the owner account", () => {
    assert.equal(isOwnerEmail("jaime32@gmail.com"), true);
    assert.equal(isOwnerEmail("Jaime32@Gmail.com"), true);
    assert.equal(isOwnerEmail(" jaime32@gmail.com "), true);
    assert.equal(isOwnerEmail("otro@gmail.com"), false);
    assert.equal(isOwnerEmail(null), false);
    assert.equal(isOwnerEmail("jaime32"), false);
    assert.equal(isOwnerEmail("@jaime32"), false);
  });

  it("credits follow the account id, never a handle change", () => {
    assert.equal(
      mergedBalance("user-now", [
        { userId: "user-old", balance: 87 },
        { userId: "user-now", balance: 5 },
      ]),
      87,
    );
    assert.equal(mergedBalance("user-now", [{ userId: "user-now", balance: 12 }]), 12);
    assert.equal(mergedBalance("user-now", []), 0);
  });
});
