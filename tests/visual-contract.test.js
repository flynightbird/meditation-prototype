import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("uses video as the only large IP carrier", () => {
  assert.doesNotMatch(html, /class="character-stage"|id="character"/);
  assert.doesNotMatch(app, /assets\/ip-(lift|meditate|stretch|walk)\.png/);
  for (const name of ["ip-lift.png", "ip-meditate.png", "ip-stretch.png", "ip-walk.png"]) {
    assert.equal(
      existsSync(new URL(`../assets/${name}`, import.meta.url)),
      false,
      `${name} should be removed`,
    );
  }
});

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
  assert.doesNotMatch(app, /highFiveHapticFired|sceneVideo\.currentTime >= 6\.7/);
  assert.match(app, /claimReward\.setAttribute\("aria-hidden"/);
});

test("synchronizes the meditation timer with actual video playback", () => {
  assert.match(app, /sceneVideo\.addEventListener\("playing", setTimerRunning\)/);
  assert.match(app, /mediaReady:\s*sceneVideo\.readyState\s*>=\s*HTMLMediaElement\.HAVE_CURRENT_DATA/);
});

test("applies media mute policy and segment replay", () => {
  assert.match(app, /sceneVideo\.muted\s*=\s*scene\.muted/);
  assert.match(app, /fromScreen === "recommendation"[\s\S]*sceneVideo\.currentTime\s*=\s*0/);
  assert.match(app, /shouldReplaySegment\(state\.screen, sceneVideo\.currentTime\)/);
});

test("runs the approved five-second settled reward timeline", () => {
  assert.match(app, /state\.screen === "reward-settled"/);
  assert.match(app, /1500/);
  assert.match(app, /5000/);
  assert.match(app, /REWARD_SETTLE_COMPLETE/);
  assert.match(app, /is-settled-components-visible/);
  assert.match(app, /is-tent-dropping/);
});

test("removes meditation feedback UI and handlers", () => {
  assert.doesNotMatch(app, /这次感觉如何|轻松一些|没进入状态|反馈已记录/);
  assert.doesNotMatch(app, /SELECT_MOOD|SKIP_FEEDBACK|FEEDBACK_COMPLETE/);
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

test("spreads one-shot reward confetti across the full viewport", () => {
  const particles = html.match(/<i style="--left:/g) ?? [];
  assert.ok(particles.length >= 24);
  assert.match(
    css,
    /\.reward-particles\s*{[^}]*inset:\s*0[^}]*overflow:\s*hidden[^}]*pointer-events:\s*none/s,
  );
  assert.match(css, /\.is-reward-entered \.reward-particles i\s*{[^}]*1800ms/s);
  assert.match(css, /calc\(1800ms - var\(--d\)\)/);
  assert.match(html, /--d: 420ms/);
  assert.match(css, /translate3d\(var\(--drift\),\s*var\(--fall\),\s*0\)/);
});

test("uses regular weight across the interface", () => {
  assert.match(css, /\.app-shell,\s*\.app-shell \*\s*{[^}]*font-weight:\s*400/s);
  assert.match(css, /\.task-footer strong,[\s\S]*\.task-card \.check\s*{[^}]*font-weight:\s*400/s);
});

test("uses regular Chill Round for display and task copy only", () => {
  assert.match(
    css,
    /@font-face\s*{[^}]*font-family:\s*"Chill Round Subset"[^}]*rounded-display\.woff2[^}]*font-weight:\s*400/s,
  );
  assert.match(css, /:root\s*{[^}]*font-family:\s*"PingFang SC"[^}]*--display:\s*"Chill Round Subset"/s);
  assert.match(css, /\.welcome-greeting\s*{[^}]*font-family:\s*var\(--display\)/s);
  assert.match(css, /\.message h1\s*{[^}]*font-family:\s*var\(--display\)[^}]*font-weight:\s*400/s);
  assert.match(css, /\.task-card\s*{[^}]*font-family:\s*var\(--display\)/s);
});

test("uses the six-tab dark dock and compact task hierarchy", () => {
  const tabs = html.match(/class="nav-item/g) ?? [];
  assert.equal(tabs.length, 6);
  for (const label of ["AI教练", "预约私教", "Skill", "训练计划", "积分", "我的"]) {
    assert.match(html, new RegExp(`class="nav-label">${label}<`));
  }
  assert.match(html, /data-nav="coach"[^>]*aria-current="page"/);
  assert.match(app, /action === "nav-tap"[^\n]*button\.dataset\.nav !== "coach"[^\n]*敬请期待/);
  assert.match(css, /\.bottom-nav\s*{[^}]*right:\s*0[^}]*bottom:\s*0[^}]*left:\s*0[^}]*height:\s*74px/s);
  assert.match(css, /\.bottom-nav\s*{[^}]*background:\s*rgba\(20,\s*13,\s*9,\s*0\.72\)/s);
  assert.match(css, /\.bottom-nav\s*{[^}]*padding:\s*8px/s);
  assert.match(css, /\.nav-item\.is-active\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/s);
  assert.match(css, /\.nav-item\.is-active \.nav-icon\s*{[^}]*color:\s*#fff[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(css, /\.nav-item\.is-active \.nav-label\s*{[^}]*color:\s*#fff/s);
  assert.match(css, /\.task-rail\s*{[^}]*bottom:\s*80px[^}]*height:\s*102px[^}]*gap:\s*10px/s);
});

test("uses compact content-sized primary controls", () => {
  assert.match(
    css,
    /\.primary-action\s*{[^}]*width:\s*auto[^}]*min-width:\s*150px[^}]*min-height:\s*46px[^}]*padding:\s*0 24px/s,
  );
  assert.match(
    css,
    /\.glass-action\s*{[^}]*min-width:\s*150px[^}]*min-height:\s*46px[^}]*padding:\s*0 24px/s,
  );
  assert.match(css, /\.session-controls button\s*{[^}]*min-height:\s*46px/s);
});

test("gives the current meal icon a larger lifted frame", () => {
  assert.match(css, /\.is-current\[data-task-icon="meal"\] \.task-visual\s*{[^}]*width:\s*88px[^}]*transform:\s*translateY\(-12px\)/s);
});

test("keeps motion fallbacks and a visible focus state for the claim bubble", () => {
  assert.match(css, /\.claim-reward:focus-visible\s*{/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.claim-reward/s);
  assert.match(css, /\.is-time-shifting \.demo-clock-track\s*{/);
});

test("task cards reserve a footer row for label and completion state", () => {
  assert.match(app, /class="task-footer"/);
  assert.match(css, /\.task-footer\s*{/);
  assert.match(css, /gap:\s*2px/);
});

test("completed task cards use the Remix checkbox-circle SVG", () => {
  assert.doesNotMatch(app, />✓</);
  assert.match(app, /<svg class="check"[^>]*viewBox="0 0 24 24"[^>]*aria-hidden="true"/);
  assert.match(app, /M12 22C6\.47715 22 2 17\.5228 2 12/);
  assert.match(css, /\.task-card \.check\s*{[^}]*width:\s*16px[^}]*fill:\s*currentColor/s);
});

test("current card uses the approved diagonal glass gradient without an outline", () => {
  assert.match(css, /linear-gradient\(\s*135deg,\s*rgba\(255,\s*241,\s*138/);
  assert.match(css, /rgba\(212,\s*243,\s*255/);
  assert.doesNotMatch(css, /\.task-card\.is-current[^}]*inset 0 0 0 2px/s);
});

test("supporting recommendation copy uses regular weight", () => {
  assert.match(css, /\.supporting\s*{[^}]*font-weight:\s*400/s);
});

test("uses a true regular title face and leaves room above the task rail", () => {
  assert.match(css, /\.message h1\s*{[^}]*font-family:\s*var\(--display\)/s);
  assert.match(css, /\.message\s*{[^}]*top:\s*80px/s);
  assert.match(css, /@media \(max-height:\s*790px\)[\s\S]*\.message\s*{[^}]*top:\s*72px/s);
  assert.match(css, /\.action-zone\s*{[^}]*bottom:\s*202px/s);
  assert.match(css, /@media \(max-height:\s*790px\)[\s\S]*\.action-zone\s*{[^}]*bottom:\s*202px/s);
});

test("current task icon is lifted clear of its label", () => {
  assert.match(
    css,
    /\.is-current \.task-visual\s*{[^}]*width:\s*72px[^}]*height:\s*56px[^}]*transform:\s*translateY\(-12px\)/s,
  );
});

test("small task cards use one centered icon frame without row gaps", () => {
  assert.match(app, /data-task-icon="\$\{icon\}"/);
  assert.match(css, /\.task-card\s*{[^}]*row-gap:\s*0/s);
  assert.doesNotMatch(css, /\n\[data-task-icon="fitness"\] \.task-visual\s*{/);
  assert.match(css, /\.task-visual\s*{[^}]*width:\s*39px[^}]*height:\s*31px[^}]*place-items:\s*center/s);
  assert.match(css, /\.is-current\[data-task-icon="fitness"\] \.task-visual\s*{[^}]*width:\s*76px/s);
});

test("uses the approved compact schedule dimensions", () => {
  assert.match(css, /\.task-rail\s*{[^}]*height:\s*102px/s);
  assert.match(css, /\.task-card\s*{[^}]*height:\s*72px/s);
  assert.match(css, /\.task-card\.is-current\s*{[^}]*height:\s*90px/s);
});

test("styles reward settling without standalone character CSS", () => {
  assert.doesNotMatch(css, /\.character(?:-stage)?\b/);
  assert.match(css, /\.reward-layer\s*{/);
  assert.match(css, /\.is-tent-dropping \.reward-object\s*{/);
  assert.match(css, /\.is-settled-components-visible\[data-screen="reward-settled"\] \.message/);
  assert.match(css, /\.reward-object\s*{[^}]*bottom:\s*188px/s);
});
