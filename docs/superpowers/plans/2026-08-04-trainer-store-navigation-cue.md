# Trainer Store Navigation Cue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the trainer Hero store link's generic northeast arrow with a paper-plane navigation icon and add the approved static `1.2km` distance cue.

**Architecture:** Keep the existing single Amap anchor and extend its inline content with one distance span and one decorative inline SVG. Style both through the existing trainer stylesheet and lock the markup, hierarchy, and retained link behavior in the existing contract test.

**Tech Stack:** HTML, CSS, inline SVG, Node.js built-in test runner

---

### Task 1: Refine the trainer Hero store navigation cue

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:93`
- Modify: `index.html:160`
- Modify: `src/trainer-booking.css:117`

- [ ] **Step 1: Write the failing contract**

Extend `links the complete store row to map navigation` with assertions that bind the store name, distance, and decorative SVG to the existing link and reject the old glyph:

```js
assert.match(
  html,
  /<span>中田健身 · 南山旗舰店<\/span>\s*<span class="trainer-store-distance">1\.2km<\/span>\s*<span class="trainer-store-navigation" aria-hidden="true">\s*<svg[^>]*viewBox="0 0 24 24"[^>]*>[\s\S]*<\/svg>\s*<\/span>/,
);
assert.doesNotMatch(html, /class="trainer-store-navigation"[^>]*>↗<\/span>/);
assert.match(
  css,
  /\.trainer-store-distance\s*{[^}]*color:\s*rgba\(255, 250, 243, 0\.5\)[^}]*font-size:\s*10px[^}]*font-variant-numeric:\s*tabular-nums/s,
);
assert.match(css, /\.trainer-store-navigation svg\s*{[^}]*width:\s*14px[^}]*height:\s*14px[^}]*stroke:\s*currentColor/s);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="links the complete store row" tests/trainer-booking-contract.test.js
```

Expected: FAIL because `trainer-store-distance` and the SVG navigation icon do not exist.

- [ ] **Step 3: Replace the old navigation glyph and add distance**

In the existing `.trainer-store` anchor, replace its final arrow span with:

```html
<span class="trainer-store-distance">1.2km</span>
<span class="trainer-store-navigation" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M3 11 22 2l-9 19-2-8-8-2Z"></path>
    <path d="m11 13 4-4"></path>
  </svg>
</span>
```

Keep the anchor's existing `href`, `target`, `rel`, `aria-label`, location dot, and store-name text unchanged.

- [ ] **Step 4: Style the distance and navigation SVG**

Update the trainer store rules to preserve one-line alignment and add the approved hierarchy:

```css
.trainer-store {
  white-space: nowrap;
}

.trainer-store-distance {
  margin-left: 2px;
  color: rgba(255, 250, 243, 0.5);
  font-size: 10px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.trainer-store-navigation {
  display: inline-flex;
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  color: #f8d553;
  line-height: 1;
  opacity: 0.82;
}

.trainer-store-navigation svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

Remove the old glyph-only `font-size` and `margin-left` declarations from `.trainer-store-navigation`.

- [ ] **Step 5: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="links the complete store row" tests/trainer-booking-contract.test.js
npm test
git diff --check
```

Expected: focused test passes, all tests pass, and `git diff --check` produces no output.

- [ ] **Step 6: Verify mobile rendering**

Open the trainer page at `375x812` and `402x874`. Confirm the store name, `1.2km`, and navigation icon remain on one line; the row has no horizontal overflow; the entire row still opens the existing Amap destination; and keyboard focus remains visible.

- [ ] **Step 7: Commit**

```bash
git add index.html src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: clarify trainer store navigation"
```
