# Video Watermark Blur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light, soft-edged blur masks over the top-left and bottom-right Doubao marks on the full-screen app video and all five portfolio videos.

**Architecture:** Reuse container pseudo-elements so no runtime JavaScript or repeated overlay markup is needed. Shared CSS custom properties define the approved `8px` blur, proportional size, inset, and fallback tint; app masks and portfolio masks use separate stacking rules so application UI, captions, and controls remain above them.

**Tech Stack:** HTML5 video, CSS pseudo-elements and backdrop filters, Node.js built-in test runner, agent-browser for responsive visual verification.

---

## File Map

- Modify `tests/visual-contract.test.js`: define the full-screen and portfolio blur-layer contracts before implementation.
- Modify `src/styles.css`: add shared watermark variables, app masks, portfolio masks, soft-edge masks, stacking, and fallback tint.
- Modify `index.html`: update the stylesheet cache key so static previews load the new CSS immediately.

### Task 1: Define The Video Watermark Contract

**Files:**
- Modify: `tests/visual-contract.test.js:175-181`
- Modify: `tests/visual-contract.test.js:619-633`

- [ ] **Step 1: Add a cache-key assertion for the new treatment**

Extend the existing stylesheet-version test with the exact new cache key:

```js
test("versions the stylesheet so static previews do not retain stale portfolio CSS", () => {
  const stylesheetTag = getOpeningTags(html, "link").find(
    (tag) => (getAttribute(tag, "rel") ?? "").split(/\s+/).includes("stylesheet"),
  );

  assert.ok(stylesheetTag);
  assert.equal(getAttribute(stylesheetTag, "href"), "./src/styles.css?v=20260804-watermark-blur");
});
```

- [ ] **Step 2: Replace the existing one-corner portfolio assertion with the complete shared contract**

Replace `pins video captions to the bottom and masks the source watermark` with:

```js
test("softly blurs both watermark corners on app and portfolio videos", () => {
  const sharedMask = getCssRule(css, ".has-media.app-shell::before");

  assert.equal(
    [
      ".has-media.app-shell::before",
      ".has-media.app-shell::after",
      ".portfolio-clip::before",
      ".portfolio-clip::after",
    ].every((selector) => sharedMask?.selectors.includes(selector)),
    true,
  );
  assert.match(sharedMask?.block ?? "", /width:\s*var\(--watermark-mask-width\)/);
  assert.match(sharedMask?.block ?? "", /height:\s*var\(--watermark-mask-height\)/);
  assert.match(sharedMask?.block ?? "", /background:\s*var\(--watermark-mask-tint\)/);
  assert.match(sharedMask?.block ?? "", /backdrop-filter:\s*blur\(var\(--watermark-mask-blur\)\)/);
  assert.match(sharedMask?.block ?? "", /-webkit-backdrop-filter:\s*blur\(var\(--watermark-mask-blur\)\)/);
  assert.match(sharedMask?.block ?? "", /pointer-events:\s*none/);

  assert.match(css, /--watermark-mask-blur:\s*8px/);
  assert.match(css, /--watermark-mask-width:\s*17%/);
  assert.match(css, /--watermark-mask-height:\s*5\.5%/);
  assert.match(css, /--watermark-mask-inset:\s*1\.2%/);
  assert.match(css, /--watermark-mask-tint:\s*rgba\(20,\s*16,\s*13,\s*0\.08\)/);

  assert.match(css, /\.has-media\.app-shell::before,\s*\.has-media\.app-shell::after\s*{[^}]*z-index:\s*3/s);
  assert.match(css, /\.portfolio-clip::before,\s*\.portfolio-clip::after\s*{[^}]*z-index:\s*1/s);
  assert.match(
    css,
    /\.has-media\.app-shell::before,\s*\.portfolio-clip::before\s*{[^}]*top:\s*var\(--watermark-mask-inset\)[^}]*left:\s*var\(--watermark-mask-inset\)[^}]*mask-image:\s*radial-gradient[^}]*-webkit-mask-image:\s*radial-gradient/s,
  );
  assert.match(
    css,
    /\.has-media\.app-shell::after,\s*\.portfolio-clip::after\s*{[^}]*right:\s*var\(--watermark-mask-inset\)[^}]*bottom:\s*var\(--watermark-mask-inset\)[^}]*mask-image:\s*radial-gradient[^}]*-webkit-mask-image:\s*radial-gradient/s,
  );
});

test("keeps portfolio captions above the watermark masks", () => {
  const desktop = getBraceBlock(css, "@media (min-width: 900px)");
  const caption = getCssRule(desktop ?? "", ".portfolio-clip figcaption");

  assert.ok(desktop);
  assert.match(caption?.block ?? "", /z-index:\s*2/);
  assert.match(caption?.block ?? "", /bottom:\s*0(?:px)?\s*;/);
  assert.match(caption?.block ?? "", /pointer-events:\s*none\s*;/);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: FAIL because the stylesheet cache key is still `20260804-video-labels`, the app has no corner pseudo-elements, and the portfolio only has the old bottom-right `10px` mask.

- [ ] **Step 4: Commit the failing contract**

```bash
git add tests/visual-contract.test.js
git commit -m "test: define video watermark blur"
```

### Task 2: Implement Shared Soft-Edge Blur Masks

**Files:**
- Modify: `src/styles.css:10-20`
- Modify: `src/styles.css:94-104`
- Modify: `src/styles.css:2006-2040`
- Modify: `index.html:9`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Add the approved shared watermark variables**

Add these declarations to `:root` after the easing variables:

```css
  --watermark-mask-blur: 8px;
  --watermark-mask-width: 17%;
  --watermark-mask-height: 5.5%;
  --watermark-mask-inset: 1.2%;
  --watermark-mask-tint: rgba(20, 16, 13, 0.08);
```

- [ ] **Step 2: Add the shared app and portfolio masks**

Insert the shared rules after `.media-failed .scene-video`:

Use an elliptical radial fade so it reaches every edge of the shallow `17%` by `5.5%` mask without leaving a visible clipped tab.

```css
.has-media.app-shell::before,
.has-media.app-shell::after,
.portfolio-clip::before,
.portfolio-clip::after {
  position: absolute;
  width: var(--watermark-mask-width);
  height: var(--watermark-mask-height);
  background: var(--watermark-mask-tint);
  backdrop-filter: blur(var(--watermark-mask-blur));
  -webkit-backdrop-filter: blur(var(--watermark-mask-blur));
  content: "";
  pointer-events: none;
}

.has-media.app-shell::before,
.has-media.app-shell::after {
  z-index: 3;
}

.portfolio-clip::before,
.portfolio-clip::after {
  z-index: 1;
}

.has-media.app-shell::before,
.portfolio-clip::before {
  top: var(--watermark-mask-inset);
  left: var(--watermark-mask-inset);
  border-radius: 0 0 10px;
  mask-image: radial-gradient(ellipse at top left, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
  -webkit-mask-image: radial-gradient(ellipse at top left, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
}

.has-media.app-shell::after,
.portfolio-clip::after {
  right: var(--watermark-mask-inset);
  bottom: var(--watermark-mask-inset);
  border-radius: 10px 0 0;
  mask-image: radial-gradient(ellipse at bottom right, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
  -webkit-mask-image: radial-gradient(ellipse at bottom right, #000 0 24%, rgba(0, 0, 0, 0.72) 48%, transparent 88%);
}
```

- [ ] **Step 3: Remove the obsolete portfolio-only mask**

Delete the old `.portfolio-clip::after` block inside `@media (min-width: 900px)`. Keep `.portfolio-clip`, `.portfolio-video`, and `.portfolio-clip figcaption` unchanged.

Delete this complete block:

```css
  .portfolio-clip::after {
    position: absolute;
    z-index: 1;
    right: 0;
    bottom: 0;
    width: 78px;
    height: 34px;
    border-radius: 6px 0 0;
    background: rgba(5, 6, 10, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    content: "";
    pointer-events: none;
  }
```

- [ ] **Step 4: Update the stylesheet cache key**

Change the stylesheet link in `index.html` to:

```html
<link rel="stylesheet" href="./src/styles.css?v=20260804-watermark-blur" />
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: all visual-contract tests pass.

- [ ] **Step 6: Run the complete suite and formatting check**

Run:

```bash
npm test
git diff --check
```

Expected: all tests pass with zero failures, and `git diff --check` exits `0` without output.

- [ ] **Step 7: Commit the implementation**

```bash
git add index.html src/styles.css
git commit -m "style: blur video watermark corners"
```

### Task 3: Verify Responsive Video Coverage

**Files:**
- Verify: `index.html`
- Verify: `src/styles.css`

- [ ] **Step 1: Start an isolated local server**

Run from the feature worktree:

```bash
python3 -m http.server 4178 --bind 127.0.0.1
```

Expected: the server reports `Serving HTTP on 127.0.0.1 port 4178`.

- [ ] **Step 2: Verify the full-screen video at both mobile sizes**

Open `http://127.0.0.1:4178/?v=watermark-blur` at `375x812` and `402x874`.

Run:

```bash
agent-browser --session watermark-blur open 'http://127.0.0.1:4178/?v=watermark-blur'
agent-browser --session watermark-blur set viewport 375 812
agent-browser --session watermark-blur screenshot /tmp/watermark-blur-375x812.png
agent-browser --session watermark-blur set viewport 402 874
agent-browser --session watermark-blur screenshot /tmp/watermark-blur-402x874.png
```

For each viewport, verify with browser-computed styles:

```text
.has-media.app-shell::before  -> blur(8px), z-index 3, pointer-events none
.has-media.app-shell::after   -> blur(8px), z-index 3, pointer-events none
```

Capture one screenshot per viewport after the scene video is visible. Confirm both corner marks are unreadable, the blur fades inward, and the greeting, task cards, primary action, and six-tab navigation remain visually above the masks.

- [ ] **Step 3: Verify the desktop portfolio grid**

Open the same URL at `1440x1000`, scroll to `#experienceClips`, and verify all five `.portfolio-clip` elements expose both pseudo-elements with `blur(8px)` and `pointer-events: none`.

Run:

```bash
agent-browser --session watermark-blur set viewport 1440 1000
agent-browser --session watermark-blur scrollintoview '#experienceClips'
agent-browser --session watermark-blur screenshot /tmp/watermark-blur-portfolio.png
```

Capture a desktop screenshot. Confirm the bottom caption remains above the mask and native video controls remain usable.

Use one bright meditation frame and one darker greeting/completion frame across the mobile and portfolio screenshots to confirm the fallback tint does not become a conspicuous block on either luminance range.

- [ ] **Step 4: Check browser errors and the final repository state**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests pass, diff check is clean, and the feature worktree contains no uncommitted tracked changes.
