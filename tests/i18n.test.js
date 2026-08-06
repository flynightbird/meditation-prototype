import test from "node:test";
import assert from "node:assert/strict";

import {
  TRANSLATIONS,
  createTranslator,
  formatBookingDate,
  formatWeekday,
  normalizeLocale,
  resolveLocale,
} from "../src/i18n.js";

test("normalizes only supported Chinese and English locales", () => {
  assert.equal(normalizeLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeLocale("zh-Hans-SG"), "zh-CN");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("en-GB"), "en");
  assert.equal(normalizeLocale("fr-FR"), null);
  assert.equal(normalizeLocale(null), null);
});

test("resolves URL before browser languages and falls back to Chinese", () => {
  assert.equal(resolveLocale({ search: "?lang=en", languages: ["zh-CN"] }), "en");
  assert.equal(resolveLocale({ search: "?lang=zh-CN", languages: ["en-US"] }), "zh-CN");
  assert.equal(resolveLocale({ search: "", languages: ["ko-KR", "en-GB"] }), "en");
  assert.equal(resolveLocale({ search: "?lang=fr", languages: ["en-US"] }), "zh-CN");
  assert.equal(resolveLocale({ search: "", languages: ["ko-KR"] }), "zh-CN");
});

test("translates named values and falls back without exposing raw keys", () => {
  const warnings = [];
  const english = createTranslator("en", { warn: (message) => warnings.push(message) });
  assert.equal(english.t("task.reward", { label: "Focus", value: 10 }), "Focus +10");
  assert.equal(english.t("test.chineseFallback"), "中文回退");
  assert.equal(english.t("test.missingEverywhere"), "");
  assert.equal(warnings.length, 3);
});

test("formats booking dates and weekdays for both locales", () => {
  assert.equal(formatWeekday("2026-08-11", "zh-CN"), "周二");
  assert.equal(formatWeekday("2026-08-11", "en"), "Tue");
  assert.equal(formatBookingDate("2026-08-11", "zh-CN"), "周二 11日");
  assert.equal(formatBookingDate("2026-08-11", "en"), "Tue, Aug 11");
});

test("keeps Chinese and English dictionary keys in parity", () => {
  assert.deepEqual(
    Object.keys(TRANSLATIONS.en).sort(),
    Object.keys(TRANSLATIONS["zh-CN"]).sort(),
  );
});
