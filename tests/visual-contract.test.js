import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("task cards reserve a footer row for label and completion state", () => {
  assert.match(app, /class="task-footer"/);
  assert.match(css, /\.task-footer\s*{/);
  assert.match(css, /gap:\s*2px/);
});

test("current card uses the approved diagonal glass gradient without an outline", () => {
  assert.match(css, /linear-gradient\(\s*135deg,\s*rgba\(255,\s*241,\s*138/);
  assert.match(css, /rgba\(212,\s*243,\s*255/);
  assert.doesNotMatch(css, /\.task-card\.is-current[^}]*inset 0 0 0 2px/s);
});

test("supporting recommendation copy uses regular weight", () => {
  assert.match(css, /\.supporting\s*{[^}]*font-weight:\s*400/s);
});

test("current task icon is lifted clear of its label", () => {
  assert.match(css, /\.is-current \.task-visual\s*{[^}]*transform:\s*translateY\(-4px\)/s);
});

test("the wide dumbbell asset gets a larger task-specific frame", () => {
  assert.match(css, /\[data-task-id="fitness"\] \.task-visual\s*{[^}]*width:\s*52px/s);
  assert.match(css, /\.is-current\[data-task-id="fitness"\] \.task-visual\s*{[^}]*width:\s*76px/s);
});
