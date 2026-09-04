import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseHandle, slugFromName, suggestHandles } from "./handle.ts";

describe("parseHandle", () => {
  it("accepts 3–16 latin handles that start with a letter", () => {
    assert.equal(parseHandle("jaime").ok, true);
    assert.equal(parseHandle("Jaime_32").ok, true);
    assert.equal(parseHandle("halo-7").ok, true);
    const ana = parseHandle("Ana");
    assert.equal(ana.ok, true);
    if (ana.ok) assert.equal(ana.lc, "ana");
  });

  it("rejects short, spaced, accented, or reserved names", () => {
    assert.deepEqual(parseHandle("ab"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseHandle("jaime martinez"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseHandle("José"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseHandle("mira"), { ok: false, reason: "reserved" });
    assert.deepEqual(parseHandle("Admin"), { ok: false, reason: "reserved" });
  });
});

describe("slugFromName", () => {
  it("takes the first word of a Google name, folded", () => {
    assert.equal(slugFromName("Jaime Martínez Lafargue"), "jaime");
    assert.equal(slugFromName("Montse Ferrando"), "montse");
  });

  it("avoids reserved stems", () => {
    assert.notEqual(slugFromName("Mira"), "mira");
    assert.equal(parseHandle(slugFromName("Mira")).ok, true);
  });
});

describe("suggestHandles", () => {
  it("skips taken and reserved, keeps three", () => {
    const taken = new Set(["jaime2", "jaime3"]);
    const out = suggestHandles("jaime", taken, 3);
    assert.equal(out.length, 3);
    assert.ok(!out.some((h) => taken.has(h.toLowerCase())));
    assert.ok(out.every((h) => parseHandle(h).ok));
  });
});
