import test from "node:test";
import assert from "node:assert/strict";

import { getGrowthStatItems } from "../src/growth-stats.js";

test("orders vitality, focus, and stamina and uses icons only for zero totals", () => {
  assert.deepEqual(getGrowthStatItems({ vitality: 0, focus: 20, stamina: 0 }), [
    { attribute: "vitality", labelKey: "growth.vitality", total: 0, mode: "icon", icon: "./assets/growth-vitality.png" },
    { attribute: "focus", labelKey: "growth.focus", total: 20, mode: "value", icon: "./assets/growth-focus.png" },
    { attribute: "stamina", labelKey: "growth.stamina", total: 0, mode: "icon", icon: "./assets/growth-stamina.png" },
  ]);
});

test("treats every positive total as a numeric value", () => {
  assert.deepEqual(
    getGrowthStatItems({ vitality: 10, focus: 1, stamina: 30 })
      .map(({ mode, total }) => ({ mode, total })),
    [{ mode: "value", total: 10 }, { mode: "value", total: 1 }, { mode: "value", total: 30 }],
  );
});
