# Standing Greeting Full-Screen Confetti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the standing-adjustment completion video before the greeting reward video and expand the one-shot reward confetti across the mobile viewport.

**Architecture:** Keep the existing state machine and single `<video>` layer. Map `completion` back to the restored one-shot asset, retain full-loop greeting media for reward states, and implement the wider confetti entirely in the existing reward DOM/CSS layer.

**Tech Stack:** Static HTML, CSS animations, ES modules, Node test runner, agent-browser.

---

### Task 1: Restore the two-video completion sequence

**Files:**
- Restore: `assets/video-meditation-complete.mp4`
- Modify: `src/media-scene.js`
- Test: `tests/media-scene.test.js`

- [x] **Step 1: Write the failing media mapping test**

Change the completion expectation while preserving reward expectations:

```js
assert.equal(
  getMediaScene("completion").src,
  "./assets/video-meditation-complete.mp4",
);
assert.equal(getMediaScene("completion").loopMode, "none");
assert.equal(getMediaScene("reward").src, "./assets/video-greeting.mp4");
assert.equal(getMediaScene("reward").loopMode, "full");
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/media-scene.test.js`

Expected: FAIL because `completion.src` still equals `./assets/video-greeting.mp4`.

- [x] **Step 3: Restore the tracked completion asset**

Run: `git restore --source=3927787 -- assets/video-meditation-complete.mp4`

Verify: `ffprobe` reports a readable H.264 video.

- [x] **Step 4: Update the media scene mapping**

Use this completion scene in `src/media-scene.js`:

```js
completion: {
  src: "./assets/video-meditation-complete.mp4",
  loopMode: "none",
  muted: false,
  seamMask: false,
},
```

Do not change `reward` or `reward-settled`; both remain full loops of `video-greeting.mp4`.

- [x] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/media-scene.test.js`

Expected: all media-scene tests PASS.

### Task 2: Expand the one-shot confetti to the full viewport

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`
- Test: `tests/visual-contract.test.js`

- [x] **Step 1: Write the failing visual contract test**

Add a test that requires a viewport-sized, non-interactive particle layer, at least 24 particles, and the 1.8-second animation:

```js
test("spreads one-shot reward confetti across the full viewport", () => {
  const particles = html.match(/<i style="--left:/g) ?? [];
  assert.ok(particles.length >= 24);
  assert.match(css, /\.reward-particles\s*{[^}]*inset:\s*0[^}]*overflow:\s*hidden[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.is-reward-entered \.reward-particles i\s*{[^}]*1800ms/s);
  assert.match(css, /translate3d\(var\(--drift\),\s*var\(--fall\),\s*0\)/);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because the current particle layer is a one-pixel anchor with ten particles.

- [x] **Step 3: Expand the particle markup**

Replace the ten anchored particles with 28 `<i>` elements using per-particle variables:

```html
<i style="--left: 3%; --drift: 22px; --fall: 74vh; --r: 240deg; --d: 0ms; --s: .78; --c: #fff1a6"></i>
<i style="--left: 8%; --drift: -18px; --fall: 92vh; --r: -300deg; --d: 120ms; --s: 1.08; --c: #dff5ff"></i>
```

Distribute all 28 `--left` values from `3%` through `98%`; vary delays from `0ms` to `420ms`, fall distances from `68vh` to `104vh`, and use warm yellow, soft white, and pale blue colors.

- [x] **Step 4: Replace the anchored particle CSS**

Use a full-screen layer and the existing reward-entry class:

```css
.reward-particles {
  position: absolute;
  z-index: 13;
  inset: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.reward-particles i {
  position: absolute;
  top: -18px;
  left: var(--left);
  width: calc(8px * var(--s));
  height: calc(13px * var(--s));
  border-radius: 80% 20% 70% 30%;
  background: var(--c);
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.28);
  will-change: transform, opacity;
}

.is-reward-entered .reward-particles i {
  animation: petal-fall 1800ms cubic-bezier(.18, .68, .24, 1) var(--d) both;
}
```

Update `petal-fall` so its final transform is:

```css
transform: translate3d(var(--drift), var(--fall), 0) rotate(var(--r)) scale(0.9);
```

Keep the existing reduced-motion rule that hides `.reward-particles`.

- [x] **Step 5: Run the focused visual test and verify GREEN**

Run: `node --test tests/visual-contract.test.js`

Expected: all visual contract tests PASS.

### Task 3: Verify, deploy, and publish the HTML link

**Files:**
- Modify only if needed: GitHub Pages configuration outside the repository working tree

- [x] **Step 1: Run complete local verification**

Run:

```bash
npm test
node --check src/app.js
git diff --check
```

Expected: 40 tests PASS, JavaScript syntax valid, no whitespace errors.

- [x] **Step 2: Verify the mobile sequence with agent-browser**

At both 402×874 and 375×812, verify:

```text
active -> completion (video-meditation-complete.mp4)
completion ended -> reward (video-greeting.mp4)
reward -> reward-settled -> meal-prep
```

Capture the reward entry while particles cover both sides of the viewport. Confirm the claim button remains clickable and browser errors are empty.

- [ ] **Step 3: Commit and push**

```bash
git add assets/video-meditation-complete.mp4 src/media-scene.js index.html src/styles.css tests/media-scene.test.js tests/visual-contract.test.js docs/superpowers/plans/2026-08-01-standing-greeting-fullscreen-confetti.md
git commit -m "feat: restore completion sequence and expand confetti"
git push origin main
```

- [ ] **Step 4: Enable or update GitHub Pages without changing repository visibility**

Use the existing private repository `flynightbird/meditation-prototype`. Configure Pages from `main` at `/` only if the account supports Pages for this private repository. Verify the deployed `index.html` and MP4 assets return HTTP 200. If GitHub rejects private Pages, report that exact limitation and request authorization before changing repository visibility.
