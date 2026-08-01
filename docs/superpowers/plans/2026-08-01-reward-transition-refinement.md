# Video-Only Reward Transition Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every large standalone IP image with video, add deterministic 2-second/1-second media loops, and move directly from a visible tent-claim celebration through a five-second settled reward scene into dinner preparation.

**Architecture:** Keep business transitions in `state-machine.js`, schedule promotion in `experience.js`, and media segment rules in `media-scene.js`. `app.js` coordinates DOM timing and video playback from those pure configurations; CSS owns only presentation classes such as reward entry, tent settling, and delayed schedule reveal.

**Tech Stack:** Semantic HTML, CSS animations, vanilla ES modules, HTMLMediaElement, Node.js `node:test`, agent-browser.

---

## File Map

- `src/state-machine.js`: remove feedback states and add the five-second `reward-settled` business state.
- `src/experience.js`: promote dinner while the settled reward scene is visible.
- `src/media-scene.js`: define source, mute policy, and loop boundaries for every video state.
- `src/app.js`: coordinate media playback, reward timing, settled UI timing, and warm crossfade.
- `index.html`: remove the standalone character node while retaining a dedicated reward overlay layer.
- `src/styles.css`: remove standalone character styling, compact task cards, and style the reward-settled timeline.
- `tests/state-machine.test.js`: cover the simplified reward flow.
- `tests/experience.test.js`: cover dinner promotion during `reward-settled`.
- `tests/media-scene.test.js`: cover mute and segment loop rules.
- `tests/visual-contract.test.js`: guard resource removal, controller timing hooks, and compact dimensions.
- `assets/ip-lift.png`, `assets/ip-meditate.png`, `assets/ip-stretch.png`, `assets/ip-walk.png`: delete from the repository.

### Task 1: Simplify the Business State Flow

**Files:**
- Modify: `tests/state-machine.test.js`
- Modify: `tests/experience.test.js`
- Modify: `src/state-machine.js`
- Modify: `src/experience.js`

- [ ] **Step 1: Write failing tests for the settled reward state**

Replace the initial-state and reward-flow tests in `tests/state-machine.test.js` with:

```js
test("starts with a twenty second meditation demo", () => {
  assert.deepEqual(createInitialState(), {
    screen: "recommendation",
    secondsRemaining: 20,
    isPaused: false,
  });
});

test("requires a manual claim then settles before dinner preparation", () => {
  const completion = { ...createInitialState(), screen: "completion", secondsRemaining: 0 };
  const reward = transition(completion, { type: "COMPLETION_VIDEO_ENDED" });
  assert.equal(reward.screen, "reward");
  assert.equal(transition(reward, { type: "TICK" }).screen, "reward");

  const settled = transition(reward, { type: "CLAIM_REWARD" });
  assert.equal(settled.screen, "reward-settled");
  assert.equal(
    transition(settled, { type: "REWARD_SETTLE_COMPLETE" }).screen,
    "meal-prep",
  );
});

test("ignores removed meditation feedback events", () => {
  const settled = { ...createInitialState(), screen: "reward-settled", secondsRemaining: 0 };
  assert.equal(transition(settled, { type: "SELECT_MOOD", mood: "lighter" }), settled);
  assert.equal(transition(settled, { type: "SKIP_FEEDBACK" }), settled);
});
```

Delete the old tests named `requires a manual reward claim before reflection` and `moves from feedback to meal preparation and demo meal time`. Retain a meal-transition test beginning with a literal `meal-prep` state.

Add this test to `tests/experience.test.js`:

```js
test("promotes dinner while the claimed tent settles", () => {
  const schedule = buildSchedule("reward-settled");
  assert.equal(schedule[2].status, "done");
  assert.equal(schedule[3].id, "dinner");
  assert.equal(schedule[3].status, "current");
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/state-machine.test.js tests/experience.test.js
```

Expected: failures because `mood` still exists, `CLAIM_REWARD` returns `reflection`, `REWARD_SETTLE_COMPLETE` is unknown, and dinner is not current during `reward-settled`.

- [ ] **Step 3: Implement the simplified transitions**

Change `createInitialState()` in `src/state-machine.js` to:

```js
export function createInitialState() {
  return {
    screen: "recommendation",
    secondsRemaining: 20,
    isPaused: false,
  };
}
```

Replace the feedback cases in `transition()` with:

```js
case "CLAIM_REWARD":
  return state.screen === "reward" ? { ...state, screen: "reward-settled" } : state;
case "REWARD_SETTLE_COMPLETE":
  return state.screen === "reward-settled" ? { ...state, screen: "meal-prep" } : state;
```

Delete the `SELECT_MOOD`, `FEEDBACK_COMPLETE`, and `SKIP_FEEDBACK` cases.

Update `buildSchedule()` in `src/experience.js`:

```js
export function buildSchedule(screen) {
  const dinnerCurrent = [
    "reward-settled",
    "meal-prep",
    "demo-time-shift",
    "meal-time",
  ].includes(screen);
  return BASE_SCHEDULE.map((task, index) => {
    let status = "upcoming";
    if (dinnerCurrent) {
      if (index <= 2) status = "done";
      if (task.id === "dinner") status = "current";
    } else {
      if (index <= 1) status = "done";
      if (task.id === "meditation") status = "current";
    }
    return { ...task, status };
  });
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/state-machine.test.js tests/experience.test.js
```

Expected: all state-machine and experience tests pass.

- [ ] **Step 5: Commit the state-flow change**

```bash
git add src/state-machine.js src/experience.js tests/state-machine.test.js tests/experience.test.js
git commit -m "feat: replace meditation feedback with reward settling"
```

### Task 2: Model Video Mute and Segment Loop Rules

**Files:**
- Modify: `tests/media-scene.test.js`
- Modify: `src/media-scene.js`

- [ ] **Step 1: Write failing media configuration tests**

Replace the first two tests in `tests/media-scene.test.js` with:

```js
test("maps application states to video-only media scenes", () => {
  const recommendation = getMediaScene("recommendation");
  assert.equal(recommendation.src, "./assets/video-meditation.mp4");
  assert.equal(recommendation.muted, true);
  assert.equal(recommendation.segmentEnd, 2);

  assert.equal(getMediaScene("active").muted, false);
  assert.equal(getMediaScene("completion").loopMode, "none");
  assert.equal(getMediaScene("reward").tailSeconds, 1);
  assert.equal(getMediaScene("reward-settled").tailSeconds, 1);
  assert.equal(getMediaScene("meal-prep").seamMask, true);
});

test("calculates approved replay positions", () => {
  assert.equal(getReplayTime("recommendation", 10.08), 0);
  assert.equal(getReplayTime("reward", 10.08), 9.08);
  assert.equal(getReplayTime("reward-settled", 10.08), 9.08);
  assert.equal(getReplayTime("active", 10.08), 0);
  assert.equal(getReplayTime("completion", 10.08), null);
});

test("loops the recommendation when it reaches two seconds", () => {
  assert.equal(shouldReplaySegment("recommendation", 1.99), false);
  assert.equal(shouldReplaySegment("recommendation", 2), true);
  assert.equal(shouldReplaySegment("active", 2), false);
});
```

Update the import to include `shouldReplaySegment`.

- [ ] **Step 2: Run the media tests and verify RED**

Run:

```bash
node --test tests/media-scene.test.js
```

Expected: failures for the missing recommendation scene, `reward-settled`, one-second tail, mute properties, and `shouldReplaySegment` export.

- [ ] **Step 3: Implement the media configuration**

Replace `SCENES` and the replay helpers in `src/media-scene.js` with:

```js
const SCENES = {
  recommendation: {
    src: "./assets/video-meditation.mp4",
    loopMode: "segment",
    segmentEnd: 2,
    muted: true,
    seamMask: false,
  },
  active: {
    src: "./assets/video-meditation.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
  completion: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "none",
    muted: false,
    seamMask: false,
  },
  reward: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "tail",
    tailSeconds: 1,
    muted: false,
    seamMask: false,
  },
  "reward-settled": {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "tail",
    tailSeconds: 1,
    muted: false,
    seamMask: false,
  },
  "meal-prep": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    muted: false,
    seamMask: true,
  },
  "demo-time-shift": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    muted: false,
    seamMask: true,
  },
  "meal-time": {
    src: "./assets/video-meal-cook.mp4",
    loopMode: "full",
    muted: false,
    seamMask: true,
  },
};

export function getMediaScene(screen) {
  return SCENES[screen] ?? null;
}

export function getReplayTime(screen, duration) {
  const scene = getMediaScene(screen);
  if (!scene || scene.loopMode === "none") return null;
  if (scene.loopMode === "tail") {
    return Math.max(0, Number((duration - scene.tailSeconds).toFixed(2)));
  }
  return 0;
}

export function shouldReplaySegment(screen, currentTime) {
  const scene = getMediaScene(screen);
  return scene?.loopMode === "segment" && currentTime >= scene.segmentEnd;
}
```

Retain `shouldRunMediaTimer()` unchanged.

- [ ] **Step 4: Run the media tests and verify GREEN**

Run:

```bash
node --test tests/media-scene.test.js
```

Expected: all media-scene tests pass.

- [ ] **Step 5: Commit the media model**

```bash
git add src/media-scene.js tests/media-scene.test.js
git commit -m "feat: model muted intro and one-second reward loops"
```

### Task 3: Remove the Standalone IP Layer and Files

**Files:**
- Modify: `tests/visual-contract.test.js`
- Modify: `index.html`
- Modify: `src/app.js`
- Delete: `assets/ip-lift.png`
- Delete: `assets/ip-meditate.png`
- Delete: `assets/ip-stretch.png`
- Delete: `assets/ip-walk.png`

- [ ] **Step 1: Write a failing visual contract for video-only IP**

Add `existsSync` to the `node:fs` import and add:

```js
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
```

- [ ] **Step 2: Run the contract test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failure because the character DOM, app references, and four image files still exist.

- [ ] **Step 3: Replace the character stage with a reward-only layer**

In `index.html`, replace the `<div class="character-stage">` opening tag with:

```html
<div class="reward-layer" id="rewardLayer">
```

Delete only this child:

```html
<img class="character" id="character" src="./assets/ip-meditate.png" alt="" />
```

Keep `claimReward`, `rewardObject`, and `reward-particles` inside `rewardLayer`.

In `src/app.js`, delete:

```js
const character = document.querySelector("#character");
```

Delete every `character.src = ...` assignment from render branches.

- [ ] **Step 4: Delete the tracked IP image files**

Run the exact recoverable Git deletion:

```bash
git rm assets/ip-lift.png assets/ip-meditate.png assets/ip-stretch.png assets/ip-walk.png
```

- [ ] **Step 5: Run the contract test and verify GREEN**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: all visual-contract tests pass. Character CSS remains temporarily unused and is removed under its own failing contract in Task 5.

- [ ] **Step 6: Commit the resource removal**

```bash
git add index.html src/app.js tests/visual-contract.test.js
git commit -m "refactor: remove standalone IP image layer"
```

### Task 4: Implement Intro Playback and the Five-Second Claim Timeline

**Files:**
- Modify: `tests/visual-contract.test.js`
- Modify: `src/app.js`

- [ ] **Step 1: Write failing controller contract tests**

Add these tests:

```js
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
```

- [ ] **Step 2: Run the contract tests and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for missing mute assignment, segment replay, settled timers/classes, and lingering feedback UI.

- [ ] **Step 3: Add controller timers and cleanup**

Import `shouldReplaySegment` from `media-scene.js`.

Replace the feedback timer declarations with:

```js
let settledUiTimer = null;
let rewardToMealTimer = null;
let rewardVeilTimer = null;
```

Add these clears to `clearScreenTimers()`:

```js
window.clearTimeout(settledUiTimer);
window.clearTimeout(rewardToMealTimer);
window.clearTimeout(rewardVeilTimer);
settledUiTimer = null;
rewardToMealTimer = null;
rewardVeilTimer = null;
```

Remove all feedback timer declarations, clears, and scheduling branches.

- [ ] **Step 4: Apply mute policy and exact media entry positions**

Inside `playCurrentScene()`, after retrieving `scene`, set:

```js
sceneVideo.muted = scene.muted;
```

At the start of `startPlayback()`, use:

```js
if (["reward", "reward-settled"].includes(state.screen)) {
  sceneVideo.currentTime = getReplayTime(state.screen, sceneVideo.duration);
}

if (state.screen === "active" && fromScreen === "recommendation") {
  sceneVideo.currentTime = 0;
}
```

Because `recommendation` now has a media scene, remove the special recommendation preloader branch from the `!scene` case. Keep `stopMedia()` for truly non-media states.

- [ ] **Step 5: Loop the two-second recommendation segment**

At the start of the `timeupdate` listener, add:

```js
if (shouldReplaySegment(state.screen, sceneVideo.currentTime)) {
  sceneVideo.currentTime = getReplayTime(state.screen, sceneVideo.duration);
  sceneVideo.play().catch(() => {});
  return;
}
```

This leaves full and tail looping in the existing `ended` handler.

- [ ] **Step 6: Render the settled reward state without feedback UI**

Change focused-state computation to:

```js
const settledComponentsVisible = app.classList.contains("is-settled-components-visible");
const focused = ["active", "completion", "reward"].includes(state.screen) ||
  (state.screen === "reward-settled" && !settledComponentsVisible);
```

Replace tent visibility computation with:

```js
const claimStatus = readStorage(CLAIM_KEY);
const tentSettling = state.screen === "reward-settled";
const hasTent = claimStatus === "claimed" && state.screen !== "reward";
const canInspectTent = hasTent && !getMediaScene(state.screen);
const showGroundTent = tentSettling || canInspectTent;
const tentIsNew = canInspectTent && readStorage(TENT_SEEN_KEY) !== "true";

app.classList.toggle("has-tent", showGroundTent);
app.classList.toggle("is-tent-new", tentIsNew);
rewardObject.setAttribute("aria-hidden", String(!showGroundTent));
rewardObject.tabIndex = canInspectTent ? 0 : -1;
```

Add this render branch and delete both feedback render branches:

```js
if (state.screen === "reward-settled") {
  message.innerHTML = `
    <p class="time-label">领取成功</p>
    <h1>静心帐篷已放入营地</h1>`;
  timerPanel.innerHTML = "";
  actionZone.innerHTML = "";
}
```

Delete the `mood` click handler.

- [ ] **Step 7: Schedule the 1.5-second reveal and 5-second warm transition**

At the top of `scheduleScreenEntry()`, remove stale classes:

```js
if (state.screen !== "reward-settled") {
  app.classList.remove("is-settled-components-visible", "is-tent-dropping");
}
```

Add this branch:

```js
if (state.screen === "reward-settled") {
  app.classList.remove("is-settled-components-visible", "is-tent-dropping");
  window.requestAnimationFrame(() => app.classList.add("is-tent-dropping"));

  settledUiTimer = window.setTimeout(() => {
    app.classList.add("is-settled-components-visible");
    taskRail.setAttribute("aria-hidden", "false");
    bottomNav.setAttribute("aria-hidden", "false");
    renderSchedule();
    centerCurrentTask("smooth");
  }, reducedMotion.matches ? 1 : 1500);

  rewardToMealTimer = window.setTimeout(() => {
    app.classList.add("is-media-veiled");
    rewardVeilTimer = window.setTimeout(() => {
      dispatch({ type: "REWARD_SETTLE_COMPLETE" });
    }, reducedMotion.matches ? 1 : 350);
  }, 5000);
}
```

In `playCurrentScene()` use the existing veil removal pattern for the new transition:

```js
if (state.screen === "meal-prep" && fromScreen === "reward-settled") {
  window.clearTimeout(mediaVeilTimer);
  mediaVeilTimer = window.setTimeout(() => {
    app.classList.remove("is-media-veiled");
  }, reducedMotion.matches ? 1 : 350);
}
```

Include `reward-settled` in the states that center the current task only after the delayed class becomes visible; do not center it immediately on state entry.

- [ ] **Step 8: Guarantee reward particles restart on every reward entry**

In the `reward` entry branch, force a clean class transition before the existing double animation frame:

```js
app.classList.remove("is-reward-entered", "is-claiming");
claimReward.classList.remove("is-claiming");
void rewardLayer.offsetWidth;
window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => app.classList.add("is-reward-entered"));
});
```

Add `const rewardLayer = document.querySelector("#rewardLayer");` near the other DOM references.

- [ ] **Step 9: Run tests and verify GREEN**

Run:

```bash
npm test
node --check src/app.js
```

Expected: all tests pass and JavaScript syntax validation exits zero.

- [ ] **Step 10: Commit the controller flow**

```bash
git add src/app.js tests/visual-contract.test.js
git commit -m "feat: add settled tent reward timeline"
```

### Task 5: Compact Cards and Refine Reward Presentation

**Files:**
- Modify: `tests/visual-contract.test.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing CSS contract tests**

Add:

```js
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
});
```

- [ ] **Step 2: Run CSS contracts and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for the old heights, missing reward-layer/settled styles, and remaining character rules.

- [ ] **Step 3: Replace character-stage positioning with reward-layer positioning**

Delete every `.character`, `.character-stage`, `character-in`, and state-specific character rule. Add:

```css
.reward-layer {
  position: absolute;
  z-index: 4;
  inset: 0;
  pointer-events: none;
}

.reward-layer button {
  pointer-events: auto;
}
```

Keep the existing claim bubble, reward object, and particle coordinates relative to this full-screen layer.

- [ ] **Step 4: Apply the compact task dimensions**

Update these blocks:

```css
.task-rail {
  height: 102px;
  padding: 5px calc(50% - 75px) 7px;
}

.task-card {
  height: 72px;
  padding: 5px 6px 5px;
  grid-template-rows: 11px minmax(0, 1fr) 16px;
}

.task-card.is-current {
  height: 90px;
  padding: 7px 10px 7px;
  grid-template-rows: 13px minmax(0, 1fr) 18px;
}
```

Do not change card widths or the existing current meal/fitness icon dimensions.

- [ ] **Step 5: Add settled reward visibility and motion**

Add:

```css
[data-screen="reward-settled"] .message {
  transition: opacity 260ms ease, transform 420ms var(--ease-out);
}

.is-settled-components-visible[data-screen="reward-settled"] .message {
  opacity: 0;
  transform: translateY(-10px);
}

[data-screen="reward-settled"]:not(.is-settled-components-visible) .task-rail {
  opacity: 0;
  pointer-events: none;
  transform: translateY(104px);
}

[data-screen="reward-settled"]:not(.is-settled-components-visible) .bottom-nav {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(72px);
}

.is-settled-components-visible[data-screen="reward-settled"] .task-rail {
  animation: rail-in 560ms var(--ease-out) both;
}

.is-settled-components-visible[data-screen="reward-settled"] .bottom-nav {
  animation: nav-in 520ms var(--ease-out) both;
}

.is-tent-dropping .reward-object {
  animation: tent-drop 520ms var(--ease-out) both;
}

[data-screen="reward-settled"] .reward-object {
  pointer-events: none;
}

@keyframes tent-drop {
  from {
    opacity: 0;
    transform: translateY(-210px) scale(1.08);
  }
  72% {
    opacity: 1;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes nav-in {
  from {
    opacity: 0;
    transform: translateY(72px);
  }
}
```

Ensure `.has-tent .reward-object` keeps opacity visible. Add `reward-object` and settled animations to the reduced-motion selector and override the settled state to stable opacity/transform.

- [ ] **Step 6: Run CSS contracts and verify GREEN**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit the visual refinement**

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "style: compact schedule and settle claimed tent"
```

### Task 6: Verify the Full Mobile Demo

**Files:**
- Create: `artifacts/reward-refinement-402x874/*.png`
- Create: `artifacts/reward-refinement-375x812/*.png`

- [ ] **Step 1: Run full static verification**

Run:

```bash
npm test
node --check src/app.js
git diff --check
rg -n "ip-(lift|meditate|stretch|walk)|reflection|feedback-confirmed|SELECT_MOOD|SKIP_FEEDBACK" index.html src tests
```

Expected: all tests pass, syntax and whitespace checks exit zero, and `rg` returns no matches.

- [ ] **Step 2: Start or reuse the local server**

Run:

```bash
npm start
```

Expected: the prototype is available at `http://127.0.0.1:4173/`. If that port is already occupied by this workspace server, reuse it rather than starting another process.

- [ ] **Step 3: Verify the 402×874 intro and active states with agent-browser**

Use a fresh agent-browser session, clear local storage, and verify:

```js
({
  screen: app.dataset.screen,
  muted: sceneVideo.muted,
  currentTime: sceneVideo.currentTime,
  readyState: sceneVideo.readyState,
  videoSize: [sceneVideo.videoWidth, sceneVideo.videoHeight]
})
```

Expected on recommendation: `muted: true`, non-zero video size, and `currentTime` repeatedly remains below approximately `2.1` seconds. Capture `intro.png`.

Click “开始冥想”. Expected: `screen: "active"`, `muted: false`, playback restarts near zero, and timer begins at `00:20`. Capture `active.png`.

- [ ] **Step 4: Verify reward entry and one-second tail loop**

Advance through completion, then verify during reward:

```js
({
  screen: app.dataset.screen,
  currentTime: sceneVideo.currentTime,
  duration: sceneVideo.duration,
  rewardEntered: app.classList.contains("is-reward-entered"),
  claimVisible: !claimReward.hidden
})
```

Expected: reward screen, `currentTime >= duration - 1.1`, reward-entered true, claim bubble visible, and particles visibly captured in `reward.png`.

- [ ] **Step 5: Verify the claim timeline at 0s, 1.5s, and 5s**

Click “点击领取” and capture:

- `settled-start.png`: ground tent visible, short message visible, task rail hidden.
- `settled-components.png` after 1.6 seconds: message transparent, dinner card current, task rail and navigation visible.
- `meal-prep.png` after the five-second hold and warm transition: meal-prep video playing, veil removed, task rail and navigation still visible.

Use DOM checks for `is-tent-dropping`, `is-settled-components-visible`, `data-screen`, `is-media-veiled`, and the current task ID.

- [ ] **Step 6: Repeat overlap checks at 375×812**

Capture the same four key states: `intro.png`, `reward.png`, `settled-components.png`, and `meal-prep.png`. Visually confirm no title/button/card overlap, the claim bubble remains face-safe, the floor tent fits above the task rail, and compact card labels are not clipped.

- [ ] **Step 7: Check browser errors and final test evidence**

Run agent-browser `errors` and `console` for both sessions. Expected: no page exceptions or media errors.

Then run:

```bash
npm test
node --check src/app.js
git diff --check
git status --short
```

Expected: all tests pass, syntax and whitespace checks exit zero, and only intentionally untracked screenshot/zip artifacts remain.

- [ ] **Step 8: Commit any verification-only test adjustments**

If browser verification required a source fix, return to RED/GREEN before this step. Otherwise no product commit is needed for untracked screenshots. If a test-only correction was necessary:

```bash
git add tests
git commit -m "test: cover video-only reward demo flow"
```
