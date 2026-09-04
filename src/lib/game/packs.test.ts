import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CREDIT_PACKS, packById, savePercent, unitCents } from "./packs.ts";

describe("credit packs", () => {
  it("Halo is 5× Pulso credits for about 3× the price", () => {
    const pulso = packById("pulso")!;
    const halo = packById("halo")!;
    assert.equal(halo.credits / pulso.credits, 5);
    const priceRatio = halo.priceCents / pulso.priceCents;
    assert.ok(priceRatio > 2.9 && priceRatio < 3.2);
  });

  it("Halo has the steepest jump in value; Mira barely beats it per credit", () => {
    const [pulso, halo, mira] = CREDIT_PACKS;
    assert.ok(unitCents(halo) < unitCents(pulso));
    assert.ok(unitCents(mira) < unitCents(halo));
    const haloSave = savePercent(halo);
    const miraSave = savePercent(mira);
    assert.ok(haloSave >= 35);
    assert.ok(miraSave - haloSave <= 6);
    assert.equal(halo.featured, true);
    assert.equal(pulso.featured, false);
  });

  it("looks up packs and ignores unknown ids", () => {
    assert.equal(packById("halo")?.credits, 25);
    assert.equal(packById("nope"), null);
  });
});
