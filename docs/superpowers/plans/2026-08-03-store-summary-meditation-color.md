# Store Summary And Meditation Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the trainer page store summary and give the home meditation action the approved booking-yellow color family without changing either control's behavior or geometry.

**Architecture:** Keep the store summary as static HTML inside the existing nearby-panel header, with an aria-hidden arrow child for the future-entry affordance. Change only the `.primary-action` background declaration; existing CSS continues to own its size, shape, border, shadow, and interaction states.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner, agent-browser mobile verification.

---

### Task 1: Update The Nearby Store Summary

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:17-22`
- Modify: `index.html:184-188`
- Modify: `src/trainer-booking.css:152-156`

- [ ] **Step 1: Write the failing store-summary contract**

Add this assertion to the existing `keeps the map and all three nearby stores` test:

```js
assert.match(
  html,
  /<span class="nearby-summary">附近有3家 ｜ 深圳市有128家 <i aria-hidden="true">›<\/i><\/span>/,
);
```

Add this CSS assertion to `positions the trainer behind the booking card and strengthens store cues`:

```js
assert.match(css, /\.nearby-summary\s*{[^}]*display:\s*inline-flex[^}]*gap:\s*4px/s);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because `index.html` still contains `共 3 家` and `.nearby-summary` does not exist.

- [ ] **Step 3: Implement the static summary and arrow treatment**

Replace the existing summary in `index.html` with:

```html
<span class="nearby-summary">附近有3家 ｜ 深圳市有128家 <i aria-hidden="true">›</i></span>
```

Update `src/trainer-booking.css` without adding click behavior:

```css
.nearby-heading .nearby-summary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  white-space: nowrap;
}

.nearby-summary i {
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-style: normal;
  line-height: 1;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: all trainer booking contract tests PASS.

- [ ] **Step 5: Commit the store-summary change**

```bash
git add index.html src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "feat: expand nearby store summary"
```

### Task 2: Reuse The Booking Yellow Color Family On Home

**Files:**
- Modify: `tests/visual-contract.test.js:107-111`
- Modify: `src/styles.css:527-543`

- [ ] **Step 1: Write the failing primary-action color contract**

Replace the existing primary-action background expectation in `uses outlined translucent yellow and black controls` with:

```js
assert.match(
  css,
  /\.primary-action\s*{[^}]*border:\s*1px solid rgba\(255, 245, 181, 0\.88\)[^}]*background:\s*linear-gradient\(135deg, #f8d553, #e8ff66\)/s,
);
```

The existing compact-control test continues to protect `min-height: 46px`, `padding: 0 24px`, and content width.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because `.primary-action` still uses `rgba(255, 212, 42, 0.82)`.

- [ ] **Step 3: Change only the primary-action background color**

In `src/styles.css`, replace only this declaration:

```css
background: linear-gradient(135deg, #f8d553, #e8ff66);
```

Do not change the button's width, height, padding, border, radius, shadow, backdrop filter, type, or transitions.

- [ ] **Step 4: Run focused and complete test suites**

Run: `node --test tests/visual-contract.test.js`

Expected: all visual contract tests PASS.

Run: `npm test`

Expected: all repository tests PASS with zero failures.

- [ ] **Step 5: Verify the two mobile viewports**

Refresh the persistent preview and use agent-browser at `375x812` and `402x874` to verify:

```text
Home: “开始冥想” retains its prior capsule geometry and shows the yellow-to-light-yellow-green color family.
Trainer: “附近有3家 ｜ 深圳市有128家 ›” stays on one line, does not overlap “附近门店”, and causes no horizontal overflow.
Regression: trainer, map, booking panel, six-tab Dock, and active-tab animation remain unchanged.
```

- [ ] **Step 6: Commit the home-button color change**

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "style: align meditation action color"
```
