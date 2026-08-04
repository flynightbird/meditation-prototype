# Trainer Media Deferred Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hidden trainer hero and map from the home-screen cold load while preserving the existing trainer page.

**Architecture:** Keep the trainer DOM and navigation unchanged. Mark the two large images with deferred source attributes, expose a small deterministic source-sync helper from the trainer view module, and call it immediately before the trainer page becomes visible.

**Tech Stack:** Static HTML, ES modules, Node test runner, Playwright CLI, GitHub Pages

**Design specification:** `docs/superpowers/specs/2026-08-03-trainer-media-deferred-loading-design.md`

---

### Task 1: Define Deferred Trainer Image Behavior

**Files:**
- Create: `tests/trainer-media.test.js`
- Modify: `src/trainer-booking-view.js`

- [ ] **Step 1: Write the failing helper tests**

Create `tests/trainer-media.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { loadDeferredTrainerImages } from "../src/trainer-booking-view.js";

function fakeImage(deferredSource, initialSource = null) {
  const attributes = new Map();
  if (initialSource) attributes.set("src", initialSource);
  return {
    dataset: { deferredSrc: deferredSource },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };
}

test("loads each deferred trainer image once", () => {
  const hero = fakeImage("./assets/trainer-hero.png");
  const map = fakeImage("./assets/trainer-map.png");

  assert.equal(loadDeferredTrainerImages([hero, map]), true);
  assert.equal(hero.getAttribute("src"), "./assets/trainer-hero.png");
  assert.equal(map.getAttribute("src"), "./assets/trainer-map.png");
  assert.equal(loadDeferredTrainerImages([hero, map]), false);
});

test("preserves an image source that is already present", () => {
  const image = fakeImage("./assets/trainer-map.png", "./assets/custom-map.png");
  assert.equal(loadDeferredTrainerImages([image]), false);
  assert.equal(image.getAttribute("src"), "./assets/custom-map.png");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/trainer-media.test.js`

Expected: FAIL because `loadDeferredTrainerImages` is not exported.

- [ ] **Step 3: Implement the minimal helper**

Add near the top of `src/trainer-booking-view.js`:

```js
export function loadDeferredTrainerImages(images) {
  let changed = false;
  for (const image of images) {
    const source = image.dataset.deferredSrc;
    if (!source || image.getAttribute("src") !== null) continue;
    image.setAttribute("src", source);
    changed = true;
  }
  return changed;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/trainer-media.test.js`

Expected: both helper tests pass.

### Task 2: Connect Deferred Sources to Trainer Navigation

**Files:**
- Modify: `index.html`
- Modify: `src/trainer-booking-view.js`
- Modify: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Write the failing markup and runtime contract test**

Add to `tests/trainer-booking-contract.test.js`:

```js
test("defers large trainer images until the trainer page opens", () => {
  const deferred = html.match(/data-deferred-src="\.\/assets\/trainer-(?:hero|map)\.png"/g) ?? [];
  assert.equal(deferred.length, 2);
  assert.doesNotMatch(
    html,
    /<img(?=[^>]*trainer-(?:hero|map)\.png)[^>]*\ssrc="\.\/assets\/trainer-(?:hero|map)\.png"/,
  );
  assert.match(view, /const deferredTrainerImages = \[\.\.\.trainerPage\.querySelectorAll\("img\[data-deferred-src\]"\)\]/);
  assert.match(view, /function show\(\)[\s\S]*loadDeferredTrainerImages\(deferredTrainerImages\)[\s\S]*trainerPage\.hidden = false/);
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because the two images still use eager `src` attributes.

- [ ] **Step 3: Replace only the two large trainer image sources**

In `index.html`, change the hero and map images to:

```html
<img data-deferred-src="./assets/trainer-hero.png" alt="李教练" />
<img data-deferred-src="./assets/trainer-map.png" alt="深圳南山区附近门店地图" />
```

Leave `trainer-avatar.png` unchanged.

- [ ] **Step 4: Load the deferred sources from `show()`**

In `mountTrainerBooking`, add after the `trainerPage` query:

```js
const deferredTrainerImages = [...trainerPage.querySelectorAll("img[data-deferred-src]")];
```

Update the start of `show()` to:

```js
function show() {
  if (visible) return;
  visible = true;
  loadDeferredTrainerImages(deferredTrainerImages);
  trainerPage.hidden = false;
```

- [ ] **Step 5: Run focused and complete tests**

Run:

```bash
node --test tests/trainer-media.test.js tests/trainer-booking-contract.test.js
npm test
node --check src/trainer-booking-view.js
git diff --check
```

Expected: all tests pass, JavaScript parses, and no whitespace errors are reported.

- [ ] **Step 6: Commit the implementation**

Run:

```bash
git add index.html src/trainer-booking-view.js tests/trainer-media.test.js tests/trainer-booking-contract.test.js
git commit -m "perf: defer trainer page media"
```

### Task 3: Verify Locally and Deploy

**Files:**
- Create outside repository: `/tmp/trainer-media-local.har`
- Create outside repository: `/tmp/trainer-media-production.har`

- [ ] **Step 1: Start a clean local server**

Run from this worktree: `python3 -m http.server 4177 --bind 127.0.0.1`

Expected: the merged prototype is available at `http://127.0.0.1:4177/`. If the port is occupied, select the next free port and use it in the following commands.

- [ ] **Step 2: Record a cold home-screen HAR**

Use a fresh Playwright browser context with `recordHar` enabled, load the local page with `waitUntil: "networkidle"`, close the context, and write `/tmp/trainer-media-local.har`.

Run:

```bash
jq '[.log.entries[].response._transferSize // 0 | select(. > 0)] | add' /tmp/trainer-media-local.har
jq -r '.log.entries[].request.url' /tmp/trainer-media-local.har | rg 'trainer-(hero|map)\.png' || true
```

Expected: total transfer is at most 2,300,000 bytes and neither large trainer URL appears.

- [ ] **Step 3: Verify click-triggered loading**

In a fresh Playwright context, register a response listener, open the local home screen, dismiss the welcome overlay if visible, and click the navigation button with `data-nav="trainer"`.

Expected: the screen enters trainer view, both `trainer-hero.png` and `trainer-map.png` return successfully, and neither URL is requested more than once.

- [ ] **Step 4: Push `main` and wait for Pages**

Run:

```bash
git push origin main
gh api repos/flynightbird/meditation-prototype/pages/builds/latest --jq '{status, commit, error}'
```

Poll the latest build until it reports `built` for the new `main` commit. Stop and report any build error.

- [ ] **Step 5: Repeat production HAR and LCP verification**

Use a fresh Playwright context against `https://flynightbird.github.io/meditation-prototype/`, write `/tmp/trainer-media-production.har`, and capture the buffered largest-contentful-paint entry.

Expected:

- production total transfer is at most 2,300,000 bytes;
- initial media contains only `video-meditation.mp4`;
- neither trainer large image is requested before navigation;
- opening the trainer page requests both large images once;
- the 375 x 812 page has no horizontal or vertical overflow;
- report the measured LCP without rounding it below the observed value.

- [ ] **Step 6: Run final verification and clean temporary worktree artifacts**

Run:

```bash
npm test
node --check src/app.js
node --check src/trainer-booking-view.js
git diff --check
git status --short --branch
```

Expected: all tests pass, the worktree is clean and synchronized with `origin/main`, and Playwright session files are absent from the repository.
