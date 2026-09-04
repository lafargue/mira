import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicHandle, nextFreeHandle, parseHandle, slugFromName, suggestHandles } from "./handle.ts";

describe("parseHandle", () => {
  it("accepts 3–16 latin handles that start with a letter", () => {
    assert.equal(parseHandle("jaime").ok, true);
    assert.equal(parseHandle("Jaime_32").ok, true);
    assert.equal(parseHandle("halo-7").ok, true);
    const ana = parseHandle("Ana");
    assert.equal(ana.ok, true);
    if (ana.ok) assert.equal(ana.lc, "ana");
  });

  it("accepts accented letters and folds them for uniqueness", () => {
    const jose = parseHandle("José");
    assert.equal(jose.ok, true);
    if (jose.ok) assert.equal(jose.lc, "jose");
    const inaki = parseHandle("Iñaki");
    assert.equal(inaki.ok, true);
    if (inaki.ok) assert.equal(inaki.lc, "inaki");
  });

  it("rejects short, spaced, or reserved names", () => {
    assert.deepEqual(parseHandle("ab"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseHandle("jaime martinez"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseHandle("mira"), { ok: false, reason: "reserved" });
    assert.deepEqual(parseHandle("Admin"), { ok: false, reason: "reserved" });
    assert.deepEqual(parseHandle("you"), { ok: false, reason: "reserved" });
  });

  it("never treats a Google full name as public", () => {
    assert.equal(isPublicHandle("Jaime Martínez Lafargue"), false);
    assert.equal(isPublicHandle("Montse Ferrando"), false);
    assert.equal(isPublicHandle("jaime"), true);
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
    assert.ok(!out.includes("jaime"));
  });

  it("uses the last name when the first is taken", () => {
    const taken = new Set(["jaime", "jaime2", "jaime3"]);
    const out = suggestHandles("jaime", taken, 3, "Jaime Martínez Lafargue");
    assert.equal(out.length, 3);
    assert.ok(out.includes("martinez") || out.some((h) => h.toLowerCase().includes("martinez") || h.toLowerCase().includes("lafargue")));
    assert.ok(!out.some((h) => taken.has(h.toLowerCase())));
  });
});

describe("nextFreeHandle", () => {
  it("keeps the desired name when it is free", () => {
    const pick = nextFreeHandle("halo", new Set(), "Jaime Martínez Lafargue");
    assert.equal(pick.seed, "halo");
    assert.equal(pick.suggestions.length, 3);
    assert.ok(!pick.suggestions.includes("halo"));
  });

  it("never seeds a taken name and offers last-name alternatives", () => {
    const taken = new Set(["jaime", "jaime2", "jaime3"]);
    const pick = nextFreeHandle("jaime", taken, "Jaime Martínez Lafargue");
    assert.notEqual(pick.seed.toLowerCase(), "jaime");
    assert.ok(!taken.has(pick.seed.toLowerCase()));
    assert.equal(parseHandle(pick.seed).ok, true);
    assert.ok(pick.suggestions.every((h) => parseHandle(h).ok && !taken.has(h.toLowerCase()) && h.toLowerCase() !== pick.seed.toLowerCase()));
    assert.ok(
      pick.seed.toLowerCase().includes("martinez") ||
        pick.seed.toLowerCase().includes("lafargue") ||
        pick.suggestions.some((h) => /martinez|lafargue/.test(h.toLowerCase())),
    );
  });
});
