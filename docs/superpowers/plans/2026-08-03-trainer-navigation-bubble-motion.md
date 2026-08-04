# Trainer Navigation And Bubble Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the trainer hero and store navigation while making unclaimed home growth bubbles visibly but gently float.

**Architecture:** Keep the changes inside the existing static view and CSS ownership boundaries. `index.html` owns the trainer copy and external map link, `src/trainer-booking.css` owns trainer presentation and interaction states, and `src/styles.css` owns growth-bubble motion. Existing contract tests provide regression coverage without adding runtime state.

**Tech Stack:** Semantic HTML, CSS animations, Node.js built-in test runner, static Python preview server

---

### Task 1: Refine The Trainer Hero And Store Navigation

**Files:**
- Modify: `tests/trainer-booking-contract.test.js`
- Modify: `index.html`
- Modify: `src/trainer-booking.css`

- [ ] **Step 1: Write the failing trainer contract tests**

Update the hero-position assertion and add a test for the exact coach copy and full-row Gaode link:

```js
assert.match(
  css,
  /\.trainer-hero > img\s*{[^}]*right:\s*-112px[^}]*top:\s*40px[^}]*bottom:\s*auto[^}]*height:\s*175%/s,
);

test("links the complete store row to map navigation", () => {
  assert.match(html, /<p>减脂塑形教练 · 8年经验<\/p>/);
  assert.match(
    html,
    /<a class="trainer-store"[^>]*href="https:\/\/uri\.amap\.com\/search\?keyword=[^"]+"[^>]*target="_blank"[^>]*aria-label="在地图中导航到中田健身 · 南山旗舰店"/,
  );
  assert.match(html, /class="trainer-store-navigation"[^>]*aria-hidden="true"/);
  assert.match(css, /\.trainer-store\s*{[^}]*text-decoration:\s*none/s);
  assert.match(css, /\.trainer-store:focus-visible\s*{[^}]*outline:/s);
  assert.match(css, /\.trainer-store:active\s*{[^}]*transform:\s*translateY\(1px\)/s);
});
```

- [ ] **Step 2: Run the trainer contract test and verify RED**

Run:

```bash
node --test tests/trainer-booking-contract.test.js
```

Expected: FAIL because the image still uses `top: 64px`, the old supporting copy remains, and `.trainer-store` is not a link.

- [ ] **Step 3: Implement the semantic map link and coach copy**

Replace the existing store paragraph and supporting copy in `index.html`:

```html
<a
  class="trainer-store"
  href="https://uri.amap.com/search?keyword=%E4%B8%AD%E7%94%B0%E5%81%A5%E8%BA%AB%20%E5%8D%97%E5%B1%B1%E6%97%97%E8%88%B0%E5%BA%97&amp;city=%E6%B7%B1%E5%9C%B3&amp;src=meditation-prototype"
  target="_blank"
  rel="noreferrer"
  aria-label="在地图中导航到中田健身 · 南山旗舰店"
>
  <span class="trainer-store-dot" aria-hidden="true"></span>
  <span>中田健身 · 南山旗舰店</span>
  <span class="trainer-store-navigation" aria-hidden="true">↗</span>
</a>
<div class="trainer-identity">
  <small>我的教练</small>
  <h1>李教练</h1>
  <p>减脂塑形教练 · 8年经验</p>
</div>
```

- [ ] **Step 4: Implement trainer positioning and link interaction states**

Update `src/trainer-booking.css` while preserving the existing image size and lower-body fade:

```css
.trainer-hero > img {
  top: 40px;
}

.trainer-store {
  right: auto;
  left: 22px;
  width: fit-content;
  max-width: calc(100% - 44px);
  padding: 4px 0;
  text-decoration: none;
  transition: color 160ms ease, transform 160ms ease;
}

.trainer-store-dot {
  flex: 0 0 5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f8d553;
  box-shadow: 0 0 8px rgba(248, 213, 83, 0.7);
}

.trainer-store-navigation {
  margin-left: 2px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.78;
}

.trainer-store:focus-visible {
  outline: 2px solid rgba(248, 213, 83, 0.82);
  outline-offset: 4px;
}

.trainer-store:active {
  transform: translateY(1px);
}
```

Remove the obsolete `.trainer-store span` selector or narrow it to `.trainer-store-dot` so the label and navigation glyph do not inherit dot dimensions.

- [ ] **Step 5: Run the trainer contract test and verify GREEN**

Run:

```bash
node --test tests/trainer-booking-contract.test.js
```

Expected: all trainer contract tests PASS.

- [ ] **Step 6: Commit the trainer refinement**

```bash
git add index.html src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "feat: refine trainer navigation cue"
```

### Task 2: Strengthen Growth Bubble Floating Motion

**Files:**
- Modify: `tests/visual-contract.test.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing bubble-motion contract**

Replace the current loose floating assertion with explicit vertical ranges and staggered durations:

```js
test("floats growth bubbles visibly with staggered vertical motion", () => {
  assert.match(css, /\.growth-bubble\.anchor-1\s*{[^}]*--float-y:\s*-6px[^}]*--float-duration:\s*4\.8s/s);
  assert.match(css, /\.growth-bubble\.anchor-2\s*{[^}]*--float-y:\s*-8px[^}]*--float-duration:\s*6\.1s/s);
  assert.match(css, /\.growth-bubble\.anchor-3\s*{[^}]*--float-y:\s*-7px[^}]*--float-duration:\s*5\.4s/s);
  assert.match(css, /\.growth-bubble\.anchor-4\s*{[^}]*--float-y:\s*-6px[^}]*--float-duration:\s*5s/s);
  assert.match(css, /@keyframes growth-bubble-float[\s\S]*translate3d\(0,\s*var\(--float-y\),\s*0\)/);
  assert.doesNotMatch(css, /@keyframes growth-bubble-float[\s\S]*scale\(/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.growth-bubble[\s\S]*animation:\s*none !important/s);
});
```

- [ ] **Step 2: Run the focused visual contract and verify RED**

Run:

```bash
node --test --test-name-pattern="floats growth bubbles" tests/visual-contract.test.js
```

Expected: FAIL because anchor travel is still 3-5px and durations use the previous values.

- [ ] **Step 3: Implement the approved anchor motion values**

Update only the bubble custom properties in `src/styles.css`:

```css
.growth-bubble.anchor-1 {
  --float-y: -6px;
  --float-duration: 4.8s;
}

.growth-bubble.anchor-2 {
  --float-y: -8px;
  --float-duration: 6.1s;
}

.growth-bubble.anchor-3 {
  --float-y: -7px;
  --float-duration: 5.4s;
}

.growth-bubble.anchor-4 {
  --float-y: -6px;
  --float-duration: 5s;
}
```

Keep the existing negative delay based on `--bubble-index`, the vertical-only keyframes, collection animation, and reduced-motion rule unchanged.

- [ ] **Step 4: Run the visual contract and verify GREEN**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: all visual contract tests PASS.

- [ ] **Step 5: Commit the bubble motion refinement**

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "style: clarify growth bubble floating motion"
```

### Task 3: Verify The Integrated Mobile Experience

**Files:**
- Verify only: `index.html`
- Verify only: `src/trainer-booking.css`
- Verify only: `src/styles.css`

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Check repository formatting and state**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no unexpected files.

- [ ] **Step 3: Start the static preview**

Run from the feature worktree:

```bash
python3 -m http.server 4174 --bind 127.0.0.1
```

Expected: the app is available at `http://127.0.0.1:4174/`.

- [ ] **Step 4: Verify the trainer view at mobile widths**

At `375×812` and `402×874`, verify:

- the trainer is 24px higher without clipping the head or covering the store link;
- `减脂塑形教练 · 8年经验` stays on one line;
- the complete store row is a comfortable tap target and the navigation glyph is aligned;
- clicking the row opens the exact Gaode Maps search URL;
- focus and pressed states do not shift surrounding layout.

- [ ] **Step 5: Verify the home bubbles and console**

At the same viewports, verify:

- visible bubbles travel vertically by 6-8px with staggered timing;
- bubbles do not drift horizontally or overlap the title, task rail, or bottom navigation;
- collection still flies toward the upper-right destination;
- reduced-motion mode stops continuous floating;
- the console has no errors or warnings.

- [ ] **Step 6: Record the verified result**

No code commit is required for this step. Report the passing test count, inspected viewports, map-link behavior, and any residual browser-cache considerations.
