# Video Watermark Edge Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the existing top-left and bottom-right video watermark blur masks with their respective horizontal media edges while preserving the current vertical inset and blur treatment.

**Architecture:** Keep the existing shared CSS pseudo-element implementation. Strengthen the visual contract first, then change the horizontal offsets from the shared inset variable to `0` and apply the visual-QA gradient refinement; validate the app and all five portfolio videos in Chromium.

**Tech Stack:** CSS pseudo-elements, Node.js built-in test runner, agent-browser.

---

## File Map

- Modify `tests/visual-contract.test.js`: require horizontal edge alignment and retained vertical insets.
- Modify `src/styles.css`: set the left mask's `left` and right mask's `right` offsets to `0`, then refine both mirrored gradient fades.

### Task 1: Define The Edge-Alignment Contract

**Files:**
- Modify: `tests/visual-contract.test.js:648-658`

- [ ] **Step 1: Update the top-left positioning and fade assertion**

Replace the top-left rule assertion with:

```js
assert.match(
  css,
  /\.has-media\.app-shell::before,\s*\.portfolio-clip::before\s*{[^}]*top:\s*var\(--watermark-mask-inset\)[^}]*left:\s*0(?:px)?\s*;[^}]*mask-image:\s*radial-gradient\(ellipse at top left,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)[^}]*-webkit-mask-image:\s*radial-gradient\(ellipse at top left,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)/s,
);
```

- [ ] **Step 2: Update the bottom-right positioning and fade assertion**

Replace the bottom-right rule assertion with:

```js
assert.match(
  css,
  /\.has-media\.app-shell::after,\s*\.portfolio-clip::after\s*{[^}]*right:\s*0(?:px)?\s*;[^}]*bottom:\s*var\(--watermark-mask-inset\)[^}]*mask-image:\s*radial-gradient\(ellipse at bottom right,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)[^}]*-webkit-mask-image:\s*radial-gradient\(ellipse at bottom right,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)/s,
);
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: one failure because `src/styles.css` still uses `var(--watermark-mask-inset)` for `left` and `right` and retains the earlier gradient stops.

- [ ] **Step 4: Commit the failing contract**

```bash
git add tests/visual-contract.test.js
git commit -m "test: require watermark masks at media edges"
```

### Task 2: Align Both Masks And Refine The Fade

**Files:**
- Modify: `src/styles.css:132-147`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Apply the approved CSS changes**

Change the horizontal offsets and gradient stops while preserving the existing geometry, vertical offsets, blur, tint, stacking, and pointer behavior:

```css
.has-media.app-shell::before,
.portfolio-clip::before {
  top: var(--watermark-mask-inset);
  left: 0;
  border-radius: 0 0 10px;
  mask-image: radial-gradient(ellipse at top left, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
  -webkit-mask-image: radial-gradient(ellipse at top left, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
}

.has-media.app-shell::after,
.portfolio-clip::after {
  right: 0;
  bottom: var(--watermark-mask-inset);
  border-radius: 10px 0 0;
  mask-image: radial-gradient(ellipse at bottom right, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
  -webkit-mask-image: radial-gradient(ellipse at bottom right, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
}
```

- [ ] **Step 2: Run focused and full verification**

Run:

```bash
node --test tests/visual-contract.test.js
npm test
git diff --check
```

Expected: the focused visual contract and all project tests pass, and the diff check produces no output.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/styles.css
git commit -m "style: align watermark masks to video edges"
```

### Task 3: Verify The Edge Alignment In Browser

**Files:**
- Verify: `src/styles.css`
- Verify: `index.html`

- [ ] **Step 1: Open the existing local preview**

Open `http://127.0.0.1:4178/?v=watermark-edge-alignment` at `402x874` and confirm computed styles:

```text
.has-media.app-shell::before -> left: 0px; top: 1.2%; blur(8px)
.has-media.app-shell::after  -> right: 0px; bottom: 1.2%; blur(8px)
```

- [ ] **Step 2: Verify the desktop portfolio**

At `1440x1000`, scroll to `#experienceClips` and confirm all five `.portfolio-clip` elements expose both masks with horizontal offset `0px` and unchanged vertical inset.

- [ ] **Step 3: Capture and inspect screenshots**

Save:

```text
/tmp/watermark-edge-mobile.png
/tmp/watermark-edge-portfolio.png
```

Confirm both masks touch their horizontal media edges, all Doubao marks remain unreadable, the soft fade has no hard rectangular boundary or pale tab, and UI and captions remain unobstructed. Hover each portfolio video and confirm its native controls stay visible and usable.

- [ ] **Step 4: Check final repository state**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests pass, diff check is clean, and no tracked changes remain after commits.
