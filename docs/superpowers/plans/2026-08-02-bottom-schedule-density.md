# Bottom Schedule Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compress the bottom task schedule and navigation while preserving card readability, touch targets, scrolling, and current-task emphasis.

**Architecture:** Keep the existing HTML and JavaScript unchanged. Update the source-level visual contract first, then change only the existing task-rail, task-card, current-card, and bottom-navigation CSS rules so all dimensions remain coordinated.

**Tech Stack:** CSS, Node.js built-in test runner, local browser verification

---

### Task 1: Lock the compact bottom-layout contract

**Files:**
- Modify: `tests/visual-contract.test.js:160`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Update the bottom navigation and task rail assertions**

Replace the old `74px`, `80px`, `102px`, and `10px` assertions in `uses the six-tab dark dock and compact task hierarchy` with:

```js
assert.match(css, /\.bottom-nav\s*{[^}]*height:\s*70px/s);
assert.match(css, /\.task-rail\s*{[^}]*bottom:\s*76px[^}]*height:\s*98px[^}]*gap:\s*4px/s);
```

Keep the existing navigation structure, material, and selected-state assertions unchanged.

- [ ] **Step 2: Update the schedule dimension assertions**

Replace `uses the approved compact schedule dimensions` with:

```js
test("uses the approved compact schedule dimensions", () => {
  assert.match(css, /\.task-rail\s*{[^}]*height:\s*98px[^}]*padding:\s*5px calc\(50% - 73px\) 5px/s);
  assert.match(css, /\.task-card\s*{[^}]*flex:\s*0 0 88px[^}]*width:\s*88px[^}]*height:\s*70px[^}]*border-radius:\s*14px/s);
  assert.match(css, /\.task-card\.is-current\s*{[^}]*flex-basis:\s*146px[^}]*width:\s*146px[^}]*height:\s*88px/s);
});
```

The centered rail padding changes from half the viewport minus `75px` to half minus `73px`, matching half of the new `146px` current-card width.

- [ ] **Step 3: Run the visual contract test and verify failure**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because `src/styles.css` still contains the old task and navigation dimensions.

### Task 2: Apply coordinated density changes

**Files:**
- Modify: `src/styles.css:568`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Compact the task rail**

Update `.task-rail` to use the approved position, height, gap, and centered padding:

```css
.task-rail {
  bottom: 76px;
  height: 98px;
  gap: 4px;
  padding: 5px calc(50% - 73px) 5px;
  scroll-padding-inline: calc(50% - 73px);
}
```

Keep every other property in the existing rule unchanged. The `5px` vertical padding plus the `88px` current card exactly fills the `98px` rail.

- [ ] **Step 2: Compact both task-card sizes and increase the radius**

Update the relevant properties without changing card internals:

```css
.task-card {
  flex: 0 0 88px;
  width: 88px;
  height: 70px;
  border-radius: 14px;
}

.task-card.is-current {
  flex-basis: 146px;
  width: 146px;
  height: 88px;
}
```

- [ ] **Step 3: Compact the bottom navigation**

Update only its fixed height:

```css
.bottom-nav {
  height: 70px;
}
```

With `8px` vertical padding, `.nav-item` remains `54px` high and exceeds the 44px touch-target minimum.

- [ ] **Step 4: Run the focused contract test**

Run: `node --test tests/visual-contract.test.js`

Expected: PASS.

- [ ] **Step 5: Run the complete automated test suite**

Run: `npm test`

Expected: all tests pass.

### Task 3: Verify mobile rendering

**Files:**
- Verify: `src/styles.css`
- Verify: `tests/visual-contract.test.js`

- [ ] **Step 1: Start the local application server**

Run: `npm start`

Expected: the application is available at `http://127.0.0.1:4173` or the next available local port.

- [ ] **Step 2: Verify the 375 x 812 viewport**

Open the application at 375 x 812, dismiss the welcome state, and confirm:

- The current card remains centered.
- Adjacent card gaps are visibly `4px` without cards merging visually.
- Card icons, times, labels, status badge, and completion mark do not clip or overlap.
- The task rail stays above the navigation with a visible separation.
- All six navigation targets remain comfortably tappable and their labels fit.

- [ ] **Step 3: Verify the 402 x 874 viewport**

Repeat the same checks at 402 x 874 and confirm horizontal scrolling still centers the current card.

- [ ] **Step 4: Check browser errors and source formatting**

Run: `git diff --check -- src/styles.css tests/visual-contract.test.js`

Expected: no whitespace errors. Confirm the browser console contains no new errors.

- [ ] **Step 5: Preserve the user's existing working-tree changes**

Run: `git diff -- src/styles.css tests/visual-contract.test.js`

Expected: the diff includes the density changes alongside pre-existing user changes. Do not stage or commit these overlapping files without a separate explicit request, because whole-file staging would include unrelated work.
