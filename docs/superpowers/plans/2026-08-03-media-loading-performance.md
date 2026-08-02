# Media Loading Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the deployed prototype's cold first-screen transfer to at most 2.3 MB and warm each next video during the preceding scene without changing the existing visual or interaction flow.

**Architecture:** Keep the current visible media player and state machine. Add a small next-source mapping plus an isolated hidden-video preload helper, defer reward artwork until completion begins, and replace only the oversized media assets with visually equivalent compressed versions. Preserve graceful fallback by leaving visible playback independent from preloading.

**Tech Stack:** Static HTML, CSS, ES modules, Node test runner, FFmpeg/libx264, cwebp, ffprobe, agent-browser, GitHub Pages.

**Design specification:** `docs/superpowers/specs/2026-08-03-media-loading-performance-design.md`

---

### Task 1: Establish a clean performance baseline without disturbing existing work

**Files:**
- Inspect only: `index.html`
- Inspect only: `src/styles.css`
- Inspect only: `tests/visual-contract.test.js`

- [ ] **Step 1: Record the existing overlapping edits**

Run:

```bash
git status --short
git diff -- index.html src/styles.css tests/visual-contract.test.js
```

Expected: the worktree is already dirty in these files. Treat every existing line as user-owned and patch the current content in place. Do not restore, reset, or replace these files wholesale.

- [ ] **Step 2: Run the baseline test suite**

Run:

```bash
npm test
```

Expected: 47 tests pass before performance work begins.

- [ ] **Step 3: Record the current asset sizes and formats**

Run:

```bash
stat -f '%z %N' assets/room.png assets/*.mp4
for media_file in assets/*.mp4; do
  ffprobe -v error \
    -show_entries format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,pix_fmt \
    -of default=noprint_wrappers=1 "$media_file"
done
```

Expected: `room.png` is 1,380,570 bytes, the videos total 7,262,720 bytes, and all videos are readable H.264/AAC 720 x 1280 at 24 fps.

### Task 2: Add enforceable asset budgets and replace the heavy files

**Files:**
- Create: `tests/media-budget.test.js`
- Create: `assets/room.webp`
- Replace: `assets/video-meditation.mp4`
- Replace: `assets/video-meditation-complete.mp4`
- Replace: `assets/video-greeting.mp4`
- Replace: `assets/video-meal-prep.mp4`
- Replace: `assets/video-meal-cook.mp4`
- Delete: `assets/room.png`
- Modify: `src/styles.css` at the `.room` background declaration

- [ ] **Step 1: Write the failing asset-budget tests**

Create `tests/media-budget.test.js`:

```js
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import test from "node:test";

const videoBudgets = new Map([
  ["video-meditation.mp4", 1_250_000],
  ["video-meditation-complete.mp4", 2_100_000],
  ["video-greeting.mp4", 500_000],
  ["video-meal-prep.mp4", 1_100_000],
  ["video-meal-cook.mp4", 1_100_000],
]);

function assetUrl(name) {
  return new URL(`../assets/${name}`, import.meta.url);
}

test("keeps every production video within its byte budget", () => {
  let total = 0;
  for (const [name, maximum] of videoBudgets) {
    const size = statSync(assetUrl(name)).size;
    total += size;
    assert.ok(size <= maximum, `${name} is ${size} bytes; maximum is ${maximum}`);
  }
  assert.ok(total <= 6_050_000, `production videos total ${total} bytes`);
});

test("uses the budgeted WebP room background", () => {
  assert.equal(existsSync(assetUrl("room.png")), false);
  const size = statSync(assetUrl("room.webp")).size;
  assert.ok(size <= 550_000, `room.webp is ${size} bytes`);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tests/media-budget.test.js
```

Expected: FAIL because the existing MP4 files exceed their limits and `room.webp` does not exist.

- [ ] **Step 3: Re-encode the media into a temporary directory**

Run exactly:

```bash
media_tmp="$(mktemp -d)"

ffmpeg -hide_banner -loglevel error -y -i assets/video-meditation.mp4 \
  -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart \
  "$media_tmp/video-meditation.mp4"

ffmpeg -hide_banner -loglevel error -y -i assets/video-meditation-complete.mp4 \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart \
  "$media_tmp/video-meditation-complete.mp4"

for media_name in video-greeting video-meal-prep video-meal-cook; do
  ffmpeg -hide_banner -loglevel error -y -i "assets/$media_name.mp4" \
    -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
    -c:a aac -b:a 96k -movflags +faststart \
    "$media_tmp/$media_name.mp4"
done

cwebp -quiet -q 82 -m 6 assets/room.png -o "$media_tmp/room.webp"
stat -f '%z %N' "$media_tmp"/*
```

Expected approximate outputs from the verified trial:

```text
room.webp                         61,340 bytes
video-meditation.mp4          1,140,035 bytes
video-meditation-complete.mp4 2,077,921 bytes
video-greeting.mp4              407,044 bytes
video-meal-prep.mp4             901,566 bytes
video-meal-cook.mp4             994,501 bytes
```

- [ ] **Step 4: Inspect the temporary outputs before replacing tracked assets**

Run:

```bash
for media_file in "$media_tmp"/*.mp4; do
  ffprobe -v error \
    -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,pix_fmt \
    -of default=noprint_wrappers=1 "$media_file"
done
```

Open the original and compressed room images side by side and inspect at 100%. Scrub the original and compressed versions of every video at the beginning, midpoint, and final second. Confirm there is no visible banding, blocking, softened character edge, damaged text, missing audio, duration change, or aspect-ratio change.

Expected: all MP4s remain H.264/AAC, 720 x 1280, 24 fps, and visually equivalent at the prototype's mobile display size.

- [ ] **Step 5: Replace the tracked assets and update the CSS reference**

Run:

```bash
mv "$media_tmp/room.webp" assets/room.webp
mv "$media_tmp/video-meditation.mp4" assets/video-meditation.mp4
mv "$media_tmp/video-meditation-complete.mp4" assets/video-meditation-complete.mp4
mv "$media_tmp/video-greeting.mp4" assets/video-greeting.mp4
mv "$media_tmp/video-meal-prep.mp4" assets/video-meal-prep.mp4
mv "$media_tmp/video-meal-cook.mp4" assets/video-meal-cook.mp4
git rm assets/room.png
```

Change only the URL in the current `.room` rule in `src/styles.css`:

```css
.room {
  z-index: -3;
  background: url("../assets/room.webp") 84% 48% / cover no-repeat;
  transform: scale(1.01);
}
```

- [ ] **Step 6: Run the focused budget tests and verify GREEN**

Run:

```bash
node --test tests/media-budget.test.js
git diff --check
```

Expected: both budget tests pass and no whitespace errors are reported.

- [ ] **Step 7: Commit the asset optimization**

Run:

```bash
git add assets/room.webp assets/*.mp4 tests/media-budget.test.js
git add -p src/styles.css
git diff --cached -- src/styles.css
git commit -m "perf: reduce initial media payload"
```

Expected: only the `.room` URL hunk is staged from `src/styles.css`; pre-existing style edits remain unstaged.

### Task 3: Define the next-video preload sequence

**Files:**
- Modify: `src/media-scene.js`
- Modify: `tests/media-scene.test.js`

- [ ] **Step 1: Write the failing next-media mapping test**

Add `getNextMediaSource` to the existing import destructuring and add:

```js
test("maps each screen to only its next unique video", () => {
  const expected = new Map([
    ["recommendation", null],
    ["active", "./assets/video-meditation-complete.mp4"],
    ["completion", "./assets/video-greeting.mp4"],
    ["reward", "./assets/video-meal-prep.mp4"],
    ["reward-settled", "./assets/video-meal-prep.mp4"],
    ["meal-prep", "./assets/video-meal-cook.mp4"],
    ["demo-time-shift", "./assets/video-meal-cook.mp4"],
    ["meal-time", null],
    ["unknown", null],
  ]);

  for (const [screen, source] of expected) {
    assert.equal(getNextMediaSource(screen), source, screen);
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/media-scene.test.js
```

Expected: FAIL because `getNextMediaSource` is not exported.

- [ ] **Step 3: Implement the explicit next-source mapping**

Add below `SCENES` in `src/media-scene.js`:

```js
const NEXT_MEDIA_SOURCES = Object.freeze({
  active: "./assets/video-meditation-complete.mp4",
  completion: "./assets/video-greeting.mp4",
  reward: "./assets/video-meal-prep.mp4",
  "reward-settled": "./assets/video-meal-prep.mp4",
  "meal-prep": "./assets/video-meal-cook.mp4",
  "demo-time-shift": "./assets/video-meal-cook.mp4",
});
```

Export the query function alongside `getMediaScene`:

```js
export function getNextMediaSource(screen) {
  return NEXT_MEDIA_SOURCES[screen] ?? null;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/media-scene.test.js
```

Expected: all media-scene tests pass.

- [ ] **Step 5: Commit the mapping**

Run:

```bash
git add src/media-scene.js tests/media-scene.test.js
git commit -m "feat: define staged video preload sequence"
```

### Task 4: Build a deterministic hidden-video preload helper

**Files:**
- Create: `src/media-preload.js`
- Create: `tests/media-preload.test.js`

- [ ] **Step 1: Write the failing helper tests**

Create `tests/media-preload.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { syncPreloadSource } from "../src/media-preload.js";

function fakeVideo(initialSource = null) {
  const attributes = new Map();
  if (initialSource) attributes.set("src", initialSource);
  return {
    muted: false,
    loadCalls: 0,
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    load() {
      this.loadCalls += 1;
    },
  };
}

test("loads a new next source and forces the preloader muted", () => {
  const video = fakeVideo();
  assert.equal(syncPreloadSource(video, "./next.mp4"), true);
  assert.equal(video.getAttribute("src"), "./next.mp4");
  assert.equal(video.muted, true);
  assert.equal(video.loadCalls, 1);
});

test("does not reload an identical next source", () => {
  const video = fakeVideo("./next.mp4");
  assert.equal(syncPreloadSource(video, "./next.mp4"), false);
  assert.equal(video.loadCalls, 0);
});

test("clears a stale preload when no next source exists", () => {
  const video = fakeVideo("./next.mp4");
  assert.equal(syncPreloadSource(video, null), true);
  assert.equal(video.getAttribute("src"), null);
  assert.equal(video.loadCalls, 1);

  assert.equal(syncPreloadSource(video, null), false);
  assert.equal(video.loadCalls, 1);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/media-preload.test.js
```

Expected: FAIL because `src/media-preload.js` does not exist.

- [ ] **Step 3: Implement the minimal helper**

Create `src/media-preload.js`:

```js
export function syncPreloadSource(video, source) {
  video.muted = true;
  const currentSource = video.getAttribute("src");

  if (!source) {
    if (currentSource === null) return false;
    video.removeAttribute("src");
    video.load();
    return true;
  }

  if (currentSource === source) return false;
  video.setAttribute("src", source);
  video.load();
  return true;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/media-preload.test.js
```

Expected: all three helper tests pass.

- [ ] **Step 5: Commit the helper**

Run:

```bash
git add src/media-preload.js tests/media-preload.test.js
git commit -m "feat: add deterministic media preloader"
```

### Task 5: Wire staged preloading into the current render flow

**Files:**
- Modify: `index.html` near `#sceneVideo`
- Modify: `src/app.js` imports, element queries, and `render`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Write the failing HTML and runtime contract test**

Extend the existing reusable media-layer test in `tests/visual-contract.test.js`:

```js
test("provides an inert hidden next-scene preloader", () => {
  assert.match(
    html,
    /<video[^>]*id="scenePreloader"[^>]*muted[^>]*playsinline[^>]*preload="auto"[^>]*hidden[^>]*aria-hidden="true"[^>]*tabindex="-1"/,
  );
  assert.match(app, /const scenePreloader = document\.querySelector\("#scenePreloader"\)/);
  assert.match(
    app,
    /syncPreloadSource\(scenePreloader, getNextMediaSource\(state\.screen\)\)/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: FAIL because `#scenePreloader` and the runtime call do not exist.

- [ ] **Step 3: Add the inert preloader element**

Immediately after `#sceneVideo` in `index.html`, add:

```html
<video
  id="scenePreloader"
  muted
  playsinline
  preload="auto"
  hidden
  aria-hidden="true"
  tabindex="-1"
></video>
```

- [ ] **Step 4: Import and query the preload dependencies**

Update the media-scene import in `src/app.js` to include:

```js
getNextMediaSource,
```

Add the helper import:

```js
import { syncPreloadSource } from "./media-preload.js";
```

Add the element query next to `sceneVideo`:

```js
const scenePreloader = document.querySelector("#scenePreloader");
```

- [ ] **Step 5: Warm only after the visible scene starts**

At the end of `render`, preserve the existing `playCurrentScene` call and add the preload only for screen changes:

```js
playCurrentScene({ fromScreen });
if (screenChanged) {
  syncPreloadSource(scenePreloader, getNextMediaSource(state.screen));
}

window.setTimeout(() => app.classList.remove("is-changing"), 620);
```

Do not await the preload and do not connect preloader errors to the app's `media-failed` class.

- [ ] **Step 6: Run focused and complete tests**

Run:

```bash
node --test tests/media-preload.test.js tests/media-scene.test.js tests/visual-contract.test.js
npm test
node --check src/app.js
```

Expected: all tests pass and JavaScript syntax is valid.

- [ ] **Step 7: Commit staged preloading**

Run:

```bash
git add -p index.html src/app.js tests/visual-contract.test.js
git diff --cached -- index.html src/app.js tests/visual-contract.test.js
git commit -m "perf: preload each upcoming video by state"
```

Expected: only the hidden-preloader markup, imports, query, and render call are staged from these overlapping files.

### Task 6: Defer reward artwork until completion playback

**Files:**
- Modify: `index.html` at the three `reward-bed.png` images
- Modify: `src/app.js` element setup and `scheduleScreenEntry`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Write the failing deferred-reward contract test**

Add to `tests/visual-contract.test.js`:

```js
test("defers reward artwork until the completion scene", () => {
  const deferred = html.match(/data-deferred-src="\.\/assets\/reward-bed\.png"/g) ?? [];
  assert.equal(deferred.length, 3);
  assert.doesNotMatch(
    html,
    /<img(?=[^>]*reward-bed\.png)[^>]*\ssrc="\.\/assets\/reward-bed\.png"/,
  );
  assert.match(
    app,
    /state\.screen === "completion"[\s\S]*ensureRewardImages\(\)/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: FAIL because all three reward images still have eager `src` attributes.

- [ ] **Step 3: Replace only the three reward image source attributes**

Change the claim image, persistent reward image, and dialog image from `src` to `data-deferred-src` while preserving their current alt text:

```html
<img data-deferred-src="./assets/reward-bed.png" alt="" />
<img data-deferred-src="./assets/reward-bed.png" alt="静心帐篷" />
<img data-deferred-src="./assets/reward-bed.png" alt="静心帐篷" />
```

- [ ] **Step 4: Add the idempotent reward-image loader**

Near the existing DOM queries in `src/app.js`, add:

```js
const deferredRewardImages = [...document.querySelectorAll("img[data-deferred-src]")];
```

Near the other module state, add:

```js
let rewardImagesRequested = false;
```

Add this helper before `scheduleScreenEntry`:

```js
function ensureRewardImages() {
  if (rewardImagesRequested) return;
  rewardImagesRequested = true;
  for (const image of deferredRewardImages) {
    const source = image.dataset.deferredSrc;
    if (source) image.src = source;
  }
}
```

- [ ] **Step 5: Start image loading during completion**

At the beginning of `scheduleScreenEntry`, after `clearScreenTimers()`, add:

```js
if (state.screen === "completion") {
  ensureRewardImages();
}
```

This gives the image the completion video's full playback interval and does not block the state transition if loading fails.

- [ ] **Step 6: Run focused and complete tests**

Run:

```bash
node --test tests/visual-contract.test.js
npm test
git diff --check
```

Expected: all tests pass and no whitespace errors are reported.

- [ ] **Step 7: Commit deferred reward loading**

Run:

```bash
git add -p index.html src/app.js tests/visual-contract.test.js
git diff --cached -- index.html src/app.js tests/visual-contract.test.js
git commit -m "perf: defer reward artwork until completion"
```

Expected: only the deferred reward-source contract, loader, completion hook, and corresponding test are staged.

### Task 7: Verify loading behavior, visuals, and release readiness

**Files:**
- Create: `artifacts/media-performance/initial-375x812.png`
- Create: `artifacts/media-performance/completion-375x812.png`
- Create: `artifacts/media-performance/reward-375x812.png`
- Create: `artifacts/media-performance/initial-402x874.png`
- Create: `artifacts/media-performance/completion-402x874.png`
- Create: `artifacts/media-performance/reward-402x874.png`
- Create outside repository: `/tmp/meditation-media-performance.har`

- [ ] **Step 1: Run the full automated verification**

Run:

```bash
npm test
node --check src/app.js
node --check src/media-scene.js
node --check src/media-preload.js
git diff --check
```

Expected: every test passes, all JavaScript files parse, and no whitespace errors are reported.

- [ ] **Step 2: Verify final media metadata and byte budgets**

Run:

```bash
for media_file in assets/*.mp4; do
  echo "$media_file"
  ffprobe -v error \
    -show_entries format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,pix_fmt \
    -of default=noprint_wrappers=1 "$media_file"
  rg -aob -m 2 'ftyp|moov|mdat' "$media_file"
done
stat -f '%z %N' assets/room.webp assets/*.mp4
```

Expected: every MP4 remains H.264/AAC 720 x 1280 at 24 fps, `moov` appears before `mdat`, all individual budgets pass, and video bytes total at most 6,050,000.

- [ ] **Step 3: Start or reuse the local server**

Run in a dedicated terminal:

```bash
npm start
```

Expected: the prototype is available at `http://127.0.0.1:4173/`. If that port is already serving this repository, reuse it rather than starting another process.

- [ ] **Step 4: Record a cold-load HAR and verify the initial request set**

Run:

```bash
agent-browser --session media-performance network har start
agent-browser --session media-performance open http://127.0.0.1:4173/
agent-browser --session media-performance wait --load networkidle
agent-browser --session media-performance network requests --type media
agent-browser --session media-performance network har stop /tmp/meditation-media-performance.har
jq '[.log.entries[].response.bodySize | select(. > 0)] | add' /tmp/meditation-media-performance.har
```

Expected: the only initial media request is `video-meditation.mp4`; there are no requests for completion, greeting, or meal videos; total cold transfer is at most 2,300,000 bytes.

- [ ] **Step 5: Verify staged requests through the interaction flow**

Clear the request log, skip the welcome animation when present, and begin meditation:

```bash
agent-browser --session media-performance network requests --clear
agent-browser --session media-performance find role button click --name "跳过欢迎动画"
agent-browser --session media-performance find role button click --name "开始冥想"
agent-browser --session media-performance wait --load networkidle
agent-browser --session media-performance network requests --type media
```

If the daily welcome is already absent, omit only the failed skip action and continue. Expected after entering `active`: one background request for `video-meditation-complete.mp4` and no greeting or meal video request.

Then end the meditation and inspect the next preload:

```bash
agent-browser --session media-performance find role button click --name "结束"
agent-browser --session media-performance wait --load networkidle
agent-browser --session media-performance network requests --type media
```

Expected: the visible completion scene reuses the warmed completion URL, then requests `video-greeting.mp4` as its next media. No canonical video URL is downloaded twice.

- [ ] **Step 6: Capture and inspect both approved mobile sizes**

At 375 x 812, reload into a fresh recommendation state, dismiss the daily welcome if it appears, and capture all three checkpoints:

```bash
agent-browser --session media-performance set viewport 375 812
agent-browser --session media-performance open http://127.0.0.1:4173/
agent-browser --session media-performance wait 2200
agent-browser --session media-performance screenshot artifacts/media-performance/initial-375x812.png
agent-browser --session media-performance find role button click --name "开始冥想"
agent-browser --session media-performance find role button click --name "结束"
agent-browser --session media-performance screenshot artifacts/media-performance/completion-375x812.png
agent-browser --session media-performance wait --text "静心帐篷已解锁"
agent-browser --session media-performance screenshot artifacts/media-performance/reward-375x812.png
```

Repeat the same flow at 402 x 874:

```bash
agent-browser --session media-performance set viewport 402 874
agent-browser --session media-performance open http://127.0.0.1:4173/
agent-browser --session media-performance wait 2200
agent-browser --session media-performance screenshot artifacts/media-performance/initial-402x874.png
agent-browser --session media-performance find role button click --name "开始冥想"
agent-browser --session media-performance find role button click --name "结束"
agent-browser --session media-performance screenshot artifacts/media-performance/completion-402x874.png
agent-browser --session media-performance wait --text "静心帐篷已解锁"
agent-browser --session media-performance screenshot artifacts/media-performance/reward-402x874.png
```

Inspect all six screenshots. Confirm the WebP room crop, gradients, character edges, timer, reward object, task rail, and bottom navigation match the pre-optimization appearance, with no blank media frame or overlapping UI.

- [ ] **Step 7: Close the browser session and commit verification artifacts**

Run:

```bash
agent-browser --session media-performance close
git add artifacts/media-performance
git commit -m "test: capture optimized media flow"
```

- [ ] **Step 8: Prepare the release handoff without deploying**

Run:

```bash
git status --short
git log --oneline -6
```

Expected: all performance work is committed, unrelated pre-existing changes remain preserved, and no push or GitHub Pages deployment has occurred. Deployment requires a separate explicit user instruction; after deployment, repeat the HAR and LCP measurements against `https://flynightbird.github.io/meditation-prototype/` and enforce the same 2.3 MB cold-load ceiling and sub-2.5-second LCP target.
