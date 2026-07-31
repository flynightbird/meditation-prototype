import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("provides one reusable full-screen media layer", () => {
  assert.match(html, /<video[^>]*id="sceneVideo"[^>]*playsinline/);
  assert.doesNotMatch(html, /<video[^>]*id="sceneVideo"[^>]*muted/);
  assert.match(html, /id="mediaTransition"/);
});

test("keeps reward claiming separate from the persistent room object", () => {
  assert.match(html, /id="claimReward"[^>]*data-action="claim-reward"/);
  assert.match(html, /class="claim-label">点击领取/);
  assert.match(html, /id="rewardObject"[^>]*data-action="object-detail"/);
});

test("renders the approved meal preparation and meal-time actions", () => {
  assert.match(app, /晚餐正在准备中/);
  assert.match(app, /17:30 提醒我/);
  assert.match(app, /晚餐时间到了/);
  assert.match(app, /我开动了/);
  assert.match(app, /src="\.\/assets\/icon-bell\.svg"/);
  assert.match(app, /src="\.\/assets\/icon-utensils\.svg"/);
});

test("handles completion, manual claiming, and presenter-controlled meal time", () => {
  assert.match(app, /COMPLETION_VIDEO_ENDED/);
  assert.match(app, /CLAIM_REWARD/);
  assert.match(app, /SET_MEAL_REMINDER/);
  assert.match(app, /DEMO_TIME_REACHED/);
  assert.match(app, /START_MEAL/);
  assert.match(app, /state\.screen === "active" && state\.isPaused[\s\S]*sceneVideo\.pause\(\)/);
  assert.match(app, /sceneVideo\.currentTime >= 6\.7/);
  assert.match(app, /claimReward\.setAttribute\("aria-hidden"/);
});

test("uses full-screen media and a warm transition veil", () => {
  assert.match(css, /\.scene-video\s*{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.media-transition\s*{/);
  assert.match(css, /\.is-media-veiled \.media-transition\s*{[^}]*opacity:\s*1/s);
});

test("uses outlined translucent yellow and black controls", () => {
  assert.match(css, /\.primary-action\s*{[^}]*border:\s*1px[^}]*rgba\(255,\s*212,\s*42,\s*0\.82\)/s);
  assert.match(css, /\.session-controls\s*{[^}]*border:\s*1px solid rgba\(255,\s*255,\s*255/s);
  assert.match(css, /\.session-controls button:last-child\s*{[^}]*rgba\(24,\s*16,\s*12,\s*0\.74\)/s);
});

test("places the claim label inside a face-safe reward bubble", () => {
  assert.match(css, /\.claim-reward\s*{[^}]*left:\s*74%[^}]*top:\s*51%/s);
  assert.match(css, /\.claim-label\s*{[^}]*background:\s*transparent[^}]*font-weight:\s*400/s);
});

test("uses regular weight outside task cards", () => {
  assert.match(css, /\.app-shell,\s*\.app-shell \*\s*{[^}]*font-weight:\s*400/s);
  assert.match(css, /\.task-footer strong,[\s\S]*\.task-card \.check\s*{[^}]*font-weight:\s*680/s);
});

test("gives the current meal icon a larger lifted frame", () => {
  assert.match(css, /\.is-current\[data-task-icon="meal"\] \.task-visual\s*{[^}]*width:\s*88px[^}]*transform:\s*translateY\(-6px\)/s);
});

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
  assert.match(app, /data-task-icon="\$\{icon\}"/);
  assert.match(css, /\[data-task-icon="fitness"\] \.task-visual\s*{[^}]*width:\s*52px/s);
  assert.match(css, /\.is-current\[data-task-icon="fitness"\] \.task-visual\s*{[^}]*width:\s*76px/s);
});
