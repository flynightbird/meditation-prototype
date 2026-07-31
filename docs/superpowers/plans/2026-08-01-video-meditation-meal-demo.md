# Video Meditation and Meal Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable 20-second Web demo that moves from video meditation through a manual bubble-tent reward into meal preparation and a presenter-controlled 17:30 cooking scene.

**Architecture:** Keep the existing vanilla JavaScript state-machine architecture. Add one reusable full-screen media layer whose source and loop policy are derived from application state, keep schedule logic pure in `experience.js`, and keep all time-based demo transitions explicit in `state-machine.js`. DOM rendering remains in `app.js`; video loop decisions move to a small tested `media-scene.js` module.

**Tech Stack:** HTML5 video, vanilla ES modules, CSS animations, Node.js built-in test runner, agent-browser, ffmpeg/ffprobe for asset inspection.

---

## File Structure

- Create `assets/video-meditation.mp4`: meditation source looped to cover the 20-second demo timer.
- Create `assets/video-meditation-complete.mp4`: one-shot stretch, stand, and high-five source.
- Create `assets/video-meal-prep.mp4`: looping meal preparation source.
- Create `assets/video-meal-cook.mp4`: looping cooking source.
- Create `assets/icon-bell.svg`: official Lucide bell icon for the reminder action.
- Create `assets/icon-utensils.svg`: official Lucide utensils icon for the meal action.
- Create `src/media-scene.js`: state-to-video configuration and loop-boundary decisions.
- Create `tests/media-scene.test.js`: pure tests for media source and replay behavior.
- Modify `src/state-machine.js`: add completion, manual reward, meal preparation, demo time shift, and meal states.
- Modify `src/experience.js`: define the seven-card schedule and current-card policy.
- Modify `src/app.js`: render new states, control video, drive timers, and handle user actions.
- Modify `src/styles.css`: full-screen media, reward bubble, translucent buttons, typography, meal layouts, and transitions.
- Modify `index.html`: add the media layer, transition veil, and dedicated claim bubble.
- Modify `tests/state-machine.test.js`: cover the complete demo state sequence.
- Modify `tests/experience.test.js`: cover seven tasks and the meal-current schedule.
- Modify `tests/visual-contract.test.js`: enforce the approved DOM and CSS contracts.

---

### Task 1: Import and Verify the Four Video Assets

**Files:**
- Create: `assets/video-meditation.mp4`
- Create: `assets/video-meditation-complete.mp4`
- Create: `assets/video-meal-prep.mp4`
- Create: `assets/video-meal-cook.mp4`
- Create: `assets/icon-bell.svg`
- Create: `assets/icon-utensils.svg`

- [ ] **Step 1: Copy the approved sources into stable project paths**

Run:

```bash
cp '/Users/admin/Downloads/小马冥想.mp4' assets/video-meditation.mp4
cp '/Users/admin/Downloads/小马站姿调整.mp4' assets/video-meditation-complete.mp4
cp '/Users/admin/Downloads/dinner prepare.mp4' assets/video-meal-prep.mp4
cp '/Users/admin/Downloads/dinner ready.mp4' assets/video-meal-cook.mp4
curl -fsSL 'https://raw.githubusercontent.com/lucide-icons/lucide/0.468.0/icons/bell.svg' -o assets/icon-bell.svg
curl -fsSL 'https://raw.githubusercontent.com/lucide-icons/lucide/0.468.0/icons/utensils.svg' -o assets/icon-utensils.svg
```

Expected: four new MP4 files and two pinned Lucide SVG files under `assets/`.

- [ ] **Step 2: Verify dimensions, duration, video codec, and audio stream**

Run:

```bash
for media in assets/video-meditation.mp4 assets/video-meditation-complete.mp4 assets/video-meal-prep.mp4 assets/video-meal-cook.mp4; do
  ffprobe -v error -show_entries format=filename,duration:stream=codec_type,codec_name,width,height -of compact "$media"
done
```

Expected for every file: H.264 video, AAC audio, 720 x 1280, and approximately 10.08 seconds.

- [ ] **Step 3: Commit the media assets**

```bash
git add assets/video-meditation.mp4 assets/video-meditation-complete.mp4 assets/video-meal-prep.mp4 assets/video-meal-cook.mp4 assets/icon-bell.svg assets/icon-utensils.svg
git commit -m "assets: add meditation and meal demo videos"
```

---

### Task 2: Extend Schedule and State Machine with TDD

**Files:**
- Modify: `tests/experience.test.js`
- Modify: `tests/state-machine.test.js`
- Modify: `src/experience.js`
- Modify: `src/state-machine.js`

- [ ] **Step 1: Replace the schedule expectations with the seven-task flow**

Add these assertions to `tests/experience.test.js`, replacing the old six-task and fitness-next tests:

```js
test("builds seven tasks with meditation as the initial current task", () => {
  const schedule = buildSchedule("recommendation");
  assert.equal(schedule.length, 7);
  assert.deepEqual(
    schedule.map(({ id, time, status }) => ({ id, time, status })),
    [
      { id: "water-am", time: "08:00", status: "done" },
      { id: "lunch", time: "12:00", status: "done" },
      { id: "meditation", time: "15:30", status: "current" },
      { id: "dinner", time: "17:30", status: "upcoming" },
      { id: "water-pm", time: "18:30", status: "upcoming" },
      { id: "fitness", time: "19:00", status: "upcoming" },
      { id: "stretch", time: "22:30", status: "upcoming" },
    ],
  );
});

test("promotes dinner after meditation feedback", () => {
  const schedule = buildSchedule("meal-prep");
  assert.equal(schedule[2].status, "done");
  assert.equal(schedule[3].id, "dinner");
  assert.equal(schedule[3].status, "current");
  assert.equal(schedule[5].time, "19:00");
});
```

- [ ] **Step 2: Replace state-machine expectations with the complete demo sequence**

Use the following tests in `tests/state-machine.test.js` while preserving the `formatTime` test:

```js
test("starts with a twenty second meditation demo", () => {
  assert.deepEqual(createInitialState(), {
    screen: "recommendation",
    secondsRemaining: 20,
    isPaused: false,
    mood: null,
  });
});

test("moves from meditation into the one-shot completion video", () => {
  let state = transition(createInitialState(), { type: "START" });
  assert.equal(state.screen, "active");

  state = { ...state, secondsRemaining: 1 };
  assert.equal(transition(state, { type: "TICK" }).screen, "completion");
  assert.equal(transition(state, { type: "END" }).screen, "completion");
});

test("requires a manual reward claim before reflection", () => {
  const completion = { ...createInitialState(), screen: "completion", secondsRemaining: 0 };
  const reward = transition(completion, { type: "COMPLETION_VIDEO_ENDED" });
  assert.equal(reward.screen, "reward");
  assert.equal(transition(reward, { type: "TICK" }).screen, "reward");
  assert.equal(transition(reward, { type: "CLAIM_REWARD" }).screen, "reflection");
});

test("moves from feedback to meal preparation and demo meal time", () => {
  const reflection = { ...createInitialState(), screen: "reflection", secondsRemaining: 0 };
  const confirmed = transition(reflection, { type: "SELECT_MOOD", mood: "lighter" });
  assert.equal(confirmed.screen, "feedback-confirmed");
  assert.equal(confirmed.mood, "lighter");

  const prep = transition(confirmed, { type: "FEEDBACK_COMPLETE" });
  assert.equal(prep.screen, "meal-prep");
  assert.equal(transition(reflection, { type: "SKIP_FEEDBACK" }).screen, "meal-prep");

  const shifting = transition(prep, { type: "SET_MEAL_REMINDER" });
  assert.equal(shifting.screen, "demo-time-shift");
  const meal = transition(shifting, { type: "DEMO_TIME_REACHED" });
  assert.equal(meal.screen, "meal-time");
});

test("starts the meal and resets the repeatable demo", () => {
  const meal = { ...createInitialState(), screen: "meal-time", secondsRemaining: 0 };
  assert.deepEqual(transition(meal, { type: "START_MEAL" }), createInitialState());
});
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
node --test tests/experience.test.js tests/state-machine.test.js
```

Expected: failures for six-task schedule, 300-second initial state, and missing `completion` / meal transitions.

- [ ] **Step 4: Implement the seven-task schedule**

Replace `BASE_SCHEDULE` and `buildSchedule` in `src/experience.js` with:

```js
const BASE_SCHEDULE = [
  { id: "water-am", time: "08:00", label: "补充水分", icon: "water" },
  { id: "lunch", time: "12:00", label: "营养午餐", icon: "meal" },
  { id: "meditation", time: "15:30", label: "冥想", icon: "meditation" },
  { id: "dinner", time: "17:30", label: "健康晚餐", icon: "meal" },
  { id: "water-pm", time: "18:30", label: "补充水分", icon: "water" },
  { id: "fitness", time: "19:00", label: "力量训练", icon: "fitness" },
  { id: "stretch", time: "22:30", label: "睡前拉伸", icon: "fitness" },
];

export function buildSchedule(screen) {
  const dinnerCurrent = ["meal-prep", "demo-time-shift", "meal-time"].includes(screen);
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

- [ ] **Step 5: Implement the explicit demo state transitions**

Replace `createInitialState` and `transition` in `src/state-machine.js` with:

```js
export function createInitialState() {
  return {
    screen: "recommendation",
    secondsRemaining: 20,
    isPaused: false,
    mood: null,
  };
}

function startCompletion(state) {
  return { ...state, screen: "completion", secondsRemaining: 0, isPaused: false };
}

export function transition(state, event) {
  switch (event.type) {
    case "START":
      return state.screen === "recommendation"
        ? { ...state, screen: "active", isPaused: false }
        : state;
    case "TOGGLE_PAUSE":
      return state.screen === "active"
        ? { ...state, isPaused: !state.isPaused }
        : state;
    case "TICK":
      if (state.screen !== "active" || state.isPaused) return state;
      return state.secondsRemaining <= 1
        ? startCompletion(state)
        : { ...state, secondsRemaining: state.secondsRemaining - 1 };
    case "END":
      return state.screen === "active" ? startCompletion(state) : state;
    case "COMPLETION_VIDEO_ENDED":
      return state.screen === "completion" ? { ...state, screen: "reward" } : state;
    case "CLAIM_REWARD":
      return state.screen === "reward" ? { ...state, screen: "reflection" } : state;
    case "SELECT_MOOD":
      return state.screen === "reflection"
        ? { ...state, screen: "feedback-confirmed", mood: event.mood }
        : state;
    case "FEEDBACK_COMPLETE":
      return state.screen === "feedback-confirmed" ? { ...state, screen: "meal-prep" } : state;
    case "SKIP_FEEDBACK":
      return state.screen === "reflection" ? { ...state, screen: "meal-prep" } : state;
    case "SET_MEAL_REMINDER":
      return state.screen === "meal-prep" ? { ...state, screen: "demo-time-shift" } : state;
    case "DEMO_TIME_REACHED":
      return state.screen === "demo-time-shift" ? { ...state, screen: "meal-time" } : state;
    case "START_MEAL":
      return state.screen === "meal-time" ? createInitialState() : state;
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}
```

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
node --test tests/experience.test.js tests/state-machine.test.js
```

Expected: all schedule and state-machine tests pass.

```bash
git add src/experience.js src/state-machine.js tests/experience.test.js tests/state-machine.test.js
git commit -m "feat: model video meditation and meal demo states"
```

---

### Task 3: Add a Tested Media Scene Configuration

**Files:**
- Create: `src/media-scene.js`
- Create: `tests/media-scene.test.js`

- [ ] **Step 1: Write failing tests for media selection and replay policy**

Create `tests/media-scene.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { getMediaScene, getReplayTime } from "../src/media-scene.js";

test("maps application states to the approved media assets", () => {
  assert.equal(getMediaScene("recommendation"), null);
  assert.equal(getMediaScene("active").src, "./assets/video-meditation.mp4");
  assert.equal(getMediaScene("completion").src, "./assets/video-meditation-complete.mp4");
  assert.equal(getMediaScene("reward").loopMode, "tail");
  assert.equal(getMediaScene("meal-prep").seamMask, true);
  assert.equal(getMediaScene("meal-time").src, "./assets/video-meal-cook.mp4");
});

test("replays the reward from the final two and a half seconds", () => {
  assert.equal(getReplayTime("reward", 10.08), 7.58);
  assert.equal(getReplayTime("active", 10.08), 0);
  assert.equal(getReplayTime("meal-prep", 10.08), 0);
  assert.equal(getReplayTime("completion", 10.08), null);
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run:

```bash
node --test tests/media-scene.test.js
```

Expected: FAIL because `src/media-scene.js` does not exist.

- [ ] **Step 3: Implement the scene map and replay calculation**

Create `src/media-scene.js`:

```js
const SCENES = {
  active: {
    src: "./assets/video-meditation.mp4",
    loopMode: "full",
    seamMask: false,
  },
  completion: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "none",
    seamMask: false,
  },
  reward: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "tail",
    seamMask: false,
  },
  "meal-prep": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    seamMask: true,
  },
  "demo-time-shift": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    seamMask: true,
  },
  "meal-time": {
    src: "./assets/video-meal-cook.mp4",
    loopMode: "full",
    seamMask: true,
  },
};

export function getMediaScene(screen) {
  return SCENES[screen] ?? null;
}

export function getReplayTime(screen, duration) {
  const scene = getMediaScene(screen);
  if (!scene || scene.loopMode === "none") return null;
  if (scene.loopMode === "tail") return Math.max(0, Number((duration - 2.5).toFixed(2)));
  return 0;
}
```

- [ ] **Step 4: Run the media tests and commit**

Run:

```bash
node --test tests/media-scene.test.js
```

Expected: 2 tests pass.

```bash
git add src/media-scene.js tests/media-scene.test.js
git commit -m "feat: add reusable media scene configuration"
```

---

### Task 4: Add the Video, Transition, and Claim Layers to the DOM

**Files:**
- Modify: `index.html`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing DOM contract assertions**

At the top of `tests/visual-contract.test.js`, read `index.html`:

```js
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
```

Add:

```js
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
```

- [ ] **Step 2: Run the DOM contract tests and verify failure**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for missing `sceneVideo`, `mediaTransition`, and `claimReward`.

- [ ] **Step 3: Add the reusable layers to `index.html`**

Insert immediately after `.room`:

```html
<video class="scene-video" id="sceneVideo" playsinline preload="auto" aria-hidden="true"></video>
<div class="media-transition" id="mediaTransition" aria-hidden="true"></div>
```

Insert inside `.character-stage`, before the persistent `.reward-object`:

```html
<button
  class="claim-reward"
  id="claimReward"
  data-action="claim-reward"
  aria-label="点击领取静心帐篷"
  hidden
>
  <img src="./assets/reward-bed.png" alt="" />
  <span class="claim-label">点击领取</span>
</button>
```

Keep the existing `rewardObject` button for later object inspection.

- [ ] **Step 4: Run the DOM contract tests and commit**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: DOM contract tests pass; CSS contracts remain unchanged.

```bash
git add index.html tests/visual-contract.test.js
git commit -m "feat: add reusable video and reward claim layers"
```

---

### Task 5: Wire Rendering, Video Events, and Demo Timers

**Files:**
- Modify: `src/app.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing rendering contract assertions**

Add to `tests/visual-contract.test.js`:

```js
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
```

- [ ] **Step 2: Run visual contracts and verify failure**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for missing copy and events.

- [ ] **Step 3: Import media configuration and cache new elements**

At the top of `src/app.js` add:

```js
import { getMediaScene, getReplayTime } from "./media-scene.js";
```

Add element references and timer state:

```js
const sceneVideo = document.querySelector("#sceneVideo");
const mediaTransition = document.querySelector("#mediaTransition");
const claimReward = document.querySelector("#claimReward");

let demoShiftTimer = null;
let mediaVeilTimer = null;
let claimDispatchTimer = null;
let highFiveHapticFired = false;
```

Remove `initialClaimStatus`, `claimLandTimer`, `claimCompleteTimer`, and resume-claim initialization. Initialize with:

```js
let state = createInitialState();
```

- [ ] **Step 4: Add one media controller path**

Add these functions to `src/app.js`:

```js
function stopMedia() {
  sceneVideo.pause();
  sceneVideo.removeAttribute("src");
  sceneVideo.load();
  app.classList.remove("has-media", "is-media-veiled", "is-time-shifting");
}

function playCurrentScene({ fromScreen = null } = {}) {
  const scene = getMediaScene(state.screen);
  if (!scene) {
    stopMedia();
    return;
  }

  const sourceChanged = sceneVideo.getAttribute("src") !== scene.src;
  app.classList.remove("media-failed");
  if (sourceChanged) {
    sceneVideo.pause();
    sceneVideo.src = scene.src;
    sceneVideo.load();
  }

  app.classList.add("has-media");

  const startPlayback = () => {
    if (state.screen === "reward") {
      sceneVideo.currentTime = getReplayTime("reward", sceneVideo.duration);
    }

    if (state.screen === "active" && state.isPaused) {
      sceneVideo.pause();
    } else {
      sceneVideo.play().catch(() => {});
    }

    if (state.screen === "meal-time" && fromScreen === "demo-time-shift") {
      window.clearTimeout(mediaVeilTimer);
      mediaVeilTimer = window.setTimeout(() => {
        app.classList.remove("is-media-veiled", "is-time-shifting");
      }, 300);
    }
  };

  if (sourceChanged && sceneVideo.readyState < HTMLMediaElement.HAVE_METADATA) {
    sceneVideo.addEventListener("loadedmetadata", startPlayback, { once: true });
  } else {
    startPlayback();
  }
}

function replayCurrentMedia() {
  const replayAt = getReplayTime(state.screen, sceneVideo.duration);
  if (replayAt === null) {
    dispatch({ type: "COMPLETION_VIDEO_ENDED" });
    return;
  }
  sceneVideo.currentTime = replayAt;
  sceneVideo.play().catch(() => {});
}

sceneVideo.addEventListener("timeupdate", () => {
  if (
    state.screen === "completion" &&
    !highFiveHapticFired &&
    sceneVideo.currentTime >= 6.7
  ) {
    highFiveHapticFired = true;
    navigator.vibrate?.(12);
  }

  const scene = getMediaScene(state.screen);
  if (!scene?.seamMask || !Number.isFinite(sceneVideo.duration)) return;
  if (sceneVideo.duration - sceneVideo.currentTime <= 0.6) {
    app.classList.add("is-media-veiled");
  }
});

sceneVideo.addEventListener("ended", () => {
  replayCurrentMedia();
  const scene = getMediaScene(state.screen);
  if (scene?.seamMask) {
    window.clearTimeout(mediaVeilTimer);
    mediaVeilTimer = window.setTimeout(() => {
      app.classList.remove("is-media-veiled");
    }, 300);
  }
});

sceneVideo.addEventListener("error", () => {
  app.classList.add("media-failed");
});
```

The `reward` branch in `startPlayback` is the only reward-entry seek: it starts at `duration - 2.5`, so the first reward frame is already in the approved standing segment. The `6.7` second completion timestamp comes from inspecting the supplied clip: the hand enters at about 6 seconds and contact occurs around 7 seconds. `highFiveHapticFired` prevents repeat vibration during the reward tail loop.

- [ ] **Step 5: Replace screen-entry timers with manual reward and demo-shift timing**

Replace `clearScreenTimers` and `scheduleScreenEntry` with:

```js
function clearScreenTimers() {
  window.clearTimeout(feedbackTimer);
  window.clearTimeout(feedbackConfirmTimer);
  window.clearTimeout(demoShiftTimer);
  window.clearTimeout(mediaVeilTimer);
  window.clearTimeout(claimDispatchTimer);
  feedbackTimer = null;
  feedbackConfirmTimer = null;
  demoShiftTimer = null;
  mediaVeilTimer = null;
  claimDispatchTimer = null;
}

function scheduleScreenEntry(fromScreen) {
  clearScreenTimers();

  if (state.screen !== "reward") {
    app.classList.remove("is-reward-entered", "is-claiming");
  }

  if (state.screen === "completion") {
    highFiveHapticFired = false;
  }

  if (state.screen === "reward") {
    app.classList.remove("is-reward-entered", "is-claiming");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => app.classList.add("is-reward-entered"));
    });
  }

  if (state.screen === "reflection") {
    feedbackTimer = window.setTimeout(() => {
      dispatch({ type: "SKIP_FEEDBACK" });
    }, 5000);
  }

  if (state.screen === "feedback-confirmed") {
    feedbackConfirmTimer = window.setTimeout(() => {
      dispatch({ type: "FEEDBACK_COMPLETE" });
    }, 650);
  }

  if (state.screen === "demo-time-shift") {
    showToast("提醒已设置");
    demoShiftTimer = window.setTimeout(() => {
      app.classList.add("is-time-shifting", "is-media-veiled");
      mediaVeilTimer = window.setTimeout(() => {
        dispatch({ type: "DEMO_TIME_REACHED" });
      }, 300);
    }, 900);
  }

  if (["recommendation", "meal-prep", "demo-time-shift", "meal-time"].includes(state.screen)) {
    centerCurrentTask(fromScreen === null ? "auto" : "smooth");
  }
}
```

This creates the approved 600ms meal-video transition: 300ms to cover the old video, switch source under the warm veil, then remove the veil 300ms after the new source has metadata. Pausing meditation is handled by both `setTimerRunning` and `playCurrentScene`, so the timer and video always pause/resume together.

- [ ] **Step 6: Render the new states and approved copy**

Use these state-specific render blocks:

```js
if (state.screen === "completion") {
  message.innerHTML = "";
  timerPanel.innerHTML = "";
  actionZone.innerHTML = "";
}

if (state.screen === "reward") {
  message.innerHTML = `
    <p class="time-label">静心营地 · 新物件</p>
    <h1>静心帐篷已解锁</h1>`;
  timerPanel.innerHTML = "";
  actionZone.innerHTML = "";
}

if (state.screen === "meal-prep" || state.screen === "demo-time-shift") {
  message.innerHTML = `
    <p class="time-label">
      <span class="demo-clock" aria-label="${state.screen === "demo-time-shift" ? "17:30" : "15:31"}">
        <span class="demo-clock-track" aria-hidden="true"><b>15:31</b><b>17:30</b></span>
      </span>
      · 静心练习已完成
    </p>
    <h1>晚餐正在准备中</h1>
    <p class="supporting">17:30 回来看看，今晚吃得轻松一点。</p>`;
  timerPanel.innerHTML = "";
  actionZone.innerHTML = `
    <button class="glass-action" data-action="meal-reminder" ${state.screen === "demo-time-shift" ? "disabled" : ""}>
      <img class="action-icon" src="./assets/icon-bell.svg" alt="" />
      <span>${state.screen === "demo-time-shift" ? "提醒已设置" : "17:30 提醒我"}</span>
    </button>`;
}

if (state.screen === "meal-time") {
  message.innerHTML = `
    <p class="time-label">17:30 · 今日健康建议</p>
    <h1>晚餐时间到了</h1>
    <p class="supporting">好好吃饭，也是今天恢复计划的一部分。</p>`;
  timerPanel.innerHTML = "";
  actionZone.innerHTML = `
    <button class="glass-action" data-action="start-meal">
      <img class="action-icon" src="./assets/icon-utensils.svg" alt="" />
      <span>我开动了</span>
    </button>`;
}
```

For `active`, compute progress with `20` rather than `300`:

```js
const progress = (state.secondsRemaining / 20) * 100;
```

Change `renderSchedule` to pass the actual state into the pure schedule function:

```js
function renderSchedule() {
  taskRail.innerHTML = buildSchedule(state.screen).map(taskCard).join("");
}
```

Replace the focus/persistent-tent calculation near the top of `render` with:

```js
const focused = ["active", "completion", "reward", "reflection", "feedback-confirmed"].includes(state.screen);
const claimStatus = readStorage(CLAIM_KEY);
const hasTent = claimStatus === "claimed" && state.screen !== "reward";
const canInspectTent = hasTent;
const tentIsNew = canInspectTent && readStorage(TENT_SEEN_KEY) !== "true";
```

At the end of `render`, replace the old screen-entry ordering with this exact order so entry timers are cleared before media playback schedules veil removal:

```js
renderSchedule();
setTimerRunning();

const fromScreen = previousScreen;
if (screenChanged) {
  previousScreen = state.screen;
  scheduleScreenEntry(fromScreen);
}
playCurrentScene({ fromScreen });

window.setTimeout(() => app.classList.remove("is-changing"), 620);
```

- [ ] **Step 7: Render claim visibility and wire user actions**

In `render`, set:

```js
const claimVisible = state.screen === "reward";
claimReward.hidden = !claimVisible;
claimReward.tabIndex = claimVisible ? 0 : -1;
claimReward.setAttribute("aria-hidden", String(!claimVisible));
```

In the delegated click handler add:

```js
if (action === "claim-reward") {
  if (state.screen !== "reward" || claimReward.classList.contains("is-claiming")) return;
  claimReward.classList.add("is-claiming");
  navigator.vibrate?.(10);
  claimDispatchTimer = window.setTimeout(() => {
    writeStorage(CLAIM_KEY, "claimed");
    app.classList.add("has-tent");
    dispatch({ type: "CLAIM_REWARD" });
  }, reducedMotion.matches ? 1 : 360);
}
if (action === "meal-reminder") dispatch({ type: "SET_MEAL_REMINDER" });
if (action === "start-meal") resetExperience("START_MEAL");
```

Change `resetExperience` to accept the state-machine event used by the presenter reset:

```js
function resetExperience(eventType = "RESET") {
  clearScreenTimers();
  removeStorage(CLAIM_KEY);
  removeStorage(TENT_SEEN_KEY);
  app.classList.remove(
    "has-tent",
    "is-tent-new",
    "is-reward-entered",
    "is-claiming",
    "is-time-shifting",
    "is-media-veiled",
  );
  state = transition(state, { type: eventType });
  render();
}
```

Remove the old `remind` action, resume-claim classes, and all automatic `CLAIM_COMPLETE` dispatches. A reward click now plays the 360ms bubble-pop animation before `CLAIM_REWARD`; it never transitions immediately.

- [ ] **Step 8: Run JavaScript checks and commit**

Run:

```bash
node --check src/app.js
npm test
```

Expected: syntax passes and all unit / visual contract tests pass.

```bash
git add src/app.js tests/visual-contract.test.js
git commit -m "feat: wire video meditation reward and meal demo"
```

---

### Task 6: Implement the Approved Visual System

**Files:**
- Modify: `src/styles.css`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing CSS contract assertions**

Add to `tests/visual-contract.test.js`:

```js
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
```

- [ ] **Step 2: Run visual contracts and verify failure**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for media, translucent controls, claim bubble, typography, and meal icon rules.

- [ ] **Step 3: Add full-screen media and transition veil styles**

Add near the `.room` styles:

```css
.scene-video {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  visibility: hidden;
  opacity: 0;
  transition: opacity 420ms ease, visibility 420ms;
}

.has-media .scene-video {
  visibility: visible;
  opacity: 1;
}

.media-failed .scene-video {
  visibility: hidden;
  opacity: 0;
}

.media-transition {
  position: absolute;
  z-index: 7;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: rgba(255, 230, 166, 0.48);
  backdrop-filter: blur(10px) brightness(1.18);
  transition: opacity 300ms ease;
}

.is-media-veiled .media-transition {
  opacity: 1;
}

[data-screen="active"] .character,
[data-screen="completion"] .character,
[data-screen="reward"] .character,
[data-screen="meal-prep"] .character,
[data-screen="demo-time-shift"] .character,
[data-screen="meal-time"] .character {
  opacity: 0;
}

[data-screen="completion"] .task-rail,
[data-screen="completion"] .bottom-nav {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(72px);
}
```

The existing layer values already keep `.app-header` (`z-index: 20`), `.message` (`10`), `.timer-panel` (`11`), `.action-zone` (`15`), `.task-rail` (`12`), and `.bottom-nav` (`18`) above `.scene-video` (`1`). Do not raise the video above any of those interface layers.

- [ ] **Step 4: Replace solid yellow and black control surfaces**

Update the primary action and session controls:

```css
.primary-action {
  border: 1px solid rgba(255, 245, 181, 0.88);
  color: var(--ink);
  background: rgba(255, 212, 42, 0.82);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.36), 0 7px 16px rgba(63, 37, 7, 0.16);
  font-weight: 400;
  backdrop-filter: blur(12px) saturate(1.08);
}

.primary-action:active {
  transform: scale(0.98);
  filter: brightness(1.04);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.32), 0 4px 10px rgba(63, 37, 7, 0.13);
}

.session-controls {
  border: 1px solid rgba(255, 255, 255, 0.48);
  background: rgba(24, 16, 12, 0.74);
  backdrop-filter: blur(12px) saturate(1.06);
}

.session-controls button {
  font-weight: 400;
}

.session-controls button:first-child {
  border-right: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(255, 212, 42, 0.82);
}

.session-controls button:last-child {
  background: rgba(24, 16, 12, 0.74);
}
```

- [ ] **Step 5: Add the internal claim bubble composition**

Add:

```css
.claim-reward {
  position: absolute;
  z-index: 14;
  left: 74%;
  top: 51%;
  display: flex;
  width: clamp(148px, 43vw, 176px);
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background:
    radial-gradient(circle at 30% 22%, rgba(255,255,255,.9) 0 4%, transparent 13%),
    radial-gradient(circle at 62% 70%, rgba(212,243,255,.3), transparent 55%),
    rgba(255,255,255,.15);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.76), inset -16px -14px 30px rgba(184,225,255,.2), 0 18px 32px rgba(45,25,12,.2);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(2px) saturate(1.15);
  cursor: pointer;
}

.claim-reward[hidden] {
  display: none;
}

.claim-reward img {
  width: 80%;
  height: 59%;
  object-fit: contain;
  transform: translateY(-12%);
}

.claim-label {
  position: absolute;
  bottom: 13%;
  left: 50%;
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 12px;
  font-weight: 400;
  text-shadow: 0 1px 4px rgba(35, 20, 10, 0.72);
  white-space: nowrap;
  transform: translateX(-50%);
}

.is-reward-entered .claim-reward {
  animation: reward-bubble-drop 700ms var(--ease-out) both;
}

.claim-reward.is-claiming {
  pointer-events: none;
  animation: reward-bubble-pop 360ms ease-in both;
}

.reward-particles {
  z-index: 13;
  top: 35%;
  right: auto;
  bottom: auto;
  left: 74%;
  opacity: 0;
  transform: translateX(-50%);
}

.is-reward-entered .reward-particles {
  opacity: 1;
}

.is-reward-entered .reward-particles i {
  animation: petal-fall 1100ms var(--ease-out) var(--d) both;
}

@keyframes reward-bubble-drop {
  0% {
    opacity: 0;
    transform: translate(-50%, -145%) scale(0.72);
  }
  68% {
    opacity: 1;
    transform: translate(-50%, -43%) scale(1.04);
  }
  84% {
    transform: translate(-50%, -54%) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes reward-bubble-pop {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  45% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.92);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.18);
  }
}
```

Delete the old `[data-screen="reward"] .reward-object`, `.is-claim-landed[data-screen="reward"] .reward-object`, and `.is-claim-landed .reward-particles` rules. The persistent room object must not participate in the claim animation; only `.claim-reward` drops and pops. Reduced-motion overrides are added in Task 7.

- [ ] **Step 6: Add glass meal actions, typography, and current meal icon rules**

Add:

```css
.glass-action {
  display: inline-flex;
  min-width: 232px;
  min-height: 58px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 20px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.13);
  box-shadow: inset 0 1px rgba(255,255,255,.28), 0 8px 20px rgba(25,15,10,.14);
  font-weight: 400;
  text-shadow: 0 1px 6px rgba(28, 15, 8, 0.52);
  backdrop-filter: blur(14px) saturate(1.12);
}

.action-icon {
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
  filter: brightness(0) invert(1);
}

.demo-clock {
  display: inline-block;
  height: 1.2em;
  overflow: hidden;
  vertical-align: -0.22em;
}

.demo-clock-track {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  transform: translateY(0);
  transition: transform 260ms var(--ease-out);
}

.is-time-shifting .demo-clock-track {
  transform: translateY(-50%);
}

.app-shell,
.app-shell * {
  font-weight: 400;
}

.task-footer strong,
.current-label,
.task-card .check {
  font-weight: 680;
}

.is-current[data-task-icon="meal"] .task-visual {
  width: 88px;
  height: 59px;
  transform: translateY(-6px);
}
```

Place this typography block after the existing component rules so the 400-weight rule wins everywhere except the three task-card selectors immediately following it. Do not add any other weight exceptions.

- [ ] **Step 7: Run visual contracts and commit**

Run:

```bash
node --test tests/visual-contract.test.js
npm test
```

Expected: all tests pass.

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "style: add therapeutic video and reward surfaces"
```

---

### Task 7: Add Focused Accessibility and Reduced-Motion Coverage

**Files:**
- Modify: `tests/visual-contract.test.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Add failing accessibility contracts**

Add:

```js
test("keeps motion fallbacks and a visible focus state for the claim bubble", () => {
  assert.match(css, /\.claim-reward:focus-visible\s*{/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.claim-reward/s);
  assert.match(css, /\.is-time-shifting \.demo-clock-track\s*{/);
});
```

- [ ] **Step 2: Run the contract and verify failure**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for missing claim focus and explicit reduced-motion bubble fallback.

- [ ] **Step 3: Add focus, hidden-state, and reduced-motion handling**

Use:

```css
.claim-reward:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .claim-reward,
  .reward-particles i,
  .media-transition,
  .message,
  .action-zone,
  .task-rail,
  .demo-clock-track {
    animation: none !important;
    transition-duration: 1ms !important;
  }

  .is-reward-entered .claim-reward {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .reward-particles {
    display: none;
  }
}
```

- [ ] **Step 4: Run all tests and commit**

Run:

```bash
npm test
node --check src/app.js
```

Expected: all tests pass and JavaScript syntax is valid.

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "test: cover reward accessibility and motion fallbacks"
```

---

### Task 8: Browser-Verify Every Demo State at Mobile Viewports

**Files:**
- Create: `artifacts/video-demo-402x874/` screenshots
- Create: `artifacts/video-demo-375x812/` screenshots

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
npm test
node --check src/app.js
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Start the app server**

Run:

```bash
npm start
```

Expected: server available at `http://127.0.0.1:4173/`. If 4173 is occupied by the existing process, reuse it after confirming it serves this workspace.

- [ ] **Step 3: Verify the 402 x 874 flow with agent-browser**

Run:

```bash
agent-browser --session meditation-demo open http://127.0.0.1:4173/?v=20260801
agent-browser --session meditation-demo set viewport 402 874
agent-browser --session meditation-demo eval 'localStorage.clear(); location.reload()'
agent-browser --session meditation-demo snapshot -i
```

Capture `recommendation.png`, click “开始冥想”, and capture `active.png`. Use `eval` to confirm media is live:

```js
(() => {
  const video = document.querySelector("#sceneVideo");
  return {
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    currentTime: video.currentTime,
    paused: video.paused,
  };
})()
```

Expected: `readyState >= 2`, `width: 720`, `height: 1280`, `currentTime > 0`, and `paused: false`.

- [ ] **Step 4: Walk the completion and reward sequence**

Click “结束”, wait for the one-shot completion video to finish, and verify:

- The high-five video plays before reward UI.
- The tail segment loops while reward waits.
- Confetti appears behind the tent.
- The bubble settles at the lower-right without covering the horse face.
- The tent fills the bubble without touching “点击领取”.
- The entire bubble is keyboard-focusable and clickable.

Capture `completion.png` and `reward.png`, then click the claim bubble.

- [ ] **Step 5: Walk feedback, preparation, demo time shift, and reset**

Select one mood, wait for `meal-prep`, and verify:

- Dinner is the current enlarged card.
- The dinner icon is lifted and does not overlap its label.
- The meal video is nonblank and playing.
- The glass reminder button is separated from the task rail.

Click “17:30 提醒我”, verify the reminder confirmation and warm transition, then capture `meal-time.png`. Click “我开动了” and verify the screen returns to the initial meditation recommendation.

- [ ] **Step 6: Repeat layout checks at 375 x 812**

Set viewport to 375 x 812 and repeat captures for active meditation, reward, meal preparation, and meal time. Confirm no text, cards, buttons, video subjects, or navigation overlap.

- [ ] **Step 7: Inspect browser errors and run final tests**

Run:

```bash
agent-browser --session meditation-demo errors
agent-browser --session meditation-demo console
npm test
git status --short
```

Expected: no application errors, no failed media loads, all tests pass, and only intended source/assets plus optional screenshot artifacts are modified.

- [ ] **Step 8: Record verification without creating an empty final commit**

Do not commit generated screenshots unless the user requests them in version control. Tasks 1-7 already commit every source, test, icon, and video file; confirm the latest commit is the Task 7 accessibility commit and leave screenshot artifacts untracked:

```bash
git log -1 --oneline
git status --short
```

Expected: the latest commit is `test: cover reward accessibility and motion fallbacks`; `git status --short` lists only optional screenshot artifacts and any unrelated pre-existing user files. Do not create a final commit when there are no source changes left.
