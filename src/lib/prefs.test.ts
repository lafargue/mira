import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STRINGS } from "./i18n/strings.ts";
import { isLocale, isTheme, LOCALES } from "./prefs.ts";

describe("prefs + i18n", () => {
  it("accepts only known themes and locales", () => {
    assert.equal(isTheme("system"), true);
    assert.equal(isTheme("dark"), true);
    assert.equal(isTheme("light"), true);
    assert.equal(isTheme("neon"), false);
    assert.equal(isLocale("es"), true);
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("xx"), false);
  });

  it("every locale has the same keys as Spanish", () => {
    const keys = Object.keys(STRINGS.es).sort();
    for (const locale of LOCALES) {
      assert.deepEqual(Object.keys(STRINGS[locale]).sort(), keys, locale);
    }
  });

  it("settings labels exist in every language", () => {
    for (const locale of LOCALES) {
      assert.ok(STRINGS[locale].settings.length > 0);
      assert.ok(STRINGS[locale].appearance.length > 0);
      assert.ok(STRINGS[locale].language.length > 0);
      assert.ok(STRINGS[locale].themeSystem.length > 0);
      assert.ok(STRINGS[locale].pressure.length > 0);
    }
  });
});
