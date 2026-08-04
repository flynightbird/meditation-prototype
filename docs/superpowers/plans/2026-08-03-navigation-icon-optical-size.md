# Navigation Icon Optical Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render navigation items 2–6 at a visually balanced 20px size while retaining their 22px layout slots.

**Architecture:** Keep the existing standard-item slot rule and add one more-specific rule for the paired state images. The state images remain absolutely positioned, with `inset: 1px` centering each 20px SVG inside its unchanged 22px slot.

**Tech Stack:** HTML, CSS, Node.js built-in test runner

---

### Task 1: Reduce standard navigation image size

**Files:**
- Modify: `tests/visual-contract.test.js:41`
- Modify: `src/styles.css:940`

- [ ] **Step 1: Write the failing visual contract**

Replace the current `matches standard navigation icons to the unselected AI coach size` test with:

```js
test("balances standard navigation icons against the unselected AI coach", () => {
  assert.match(
    css,
    /\.nav-item:not\(\[data-nav="coach"\]\) \.nav-icon\s*{[^}]*flex-basis:\s*22px[^}]*width:\s*22px[^}]*height:\s*22px/s,
  );
  assert.match(
    css,
    /\.nav-item:not\(\[data-nav="coach"\]\) \.nav-state-icon\s*{[^}]*inset:\s*1px[^}]*width:\s*20px[^}]*height:\s*20px/s,
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="balances standard navigation icons" tests/visual-contract.test.js
```

Expected: FAIL because the standard state-image rule does not yet exist.

- [ ] **Step 3: Implement the centered 20px state images**

Keep the existing `.nav-item:not([data-nav="coach"]) .nav-icon` rule and add immediately after it:

```css
.nav-item:not([data-nav="coach"]) .nav-state-icon {
  inset: 1px;
  width: 20px;
  height: 20px;
}
```

- [ ] **Step 4: Verify GREEN and the full suite**

Run:

```bash
node --test --test-name-pattern="balances standard navigation icons" tests/visual-contract.test.js
npm test
git diff --check
```

Expected: the focused contract passes, all project tests pass, and `git diff --check` emits no output.

- [ ] **Step 5: Verify the live navigation**

Reload `http://127.0.0.1:4176/` and inspect at `375x812` and `402x874`.

Expected: items 2–6 have 22px slots with centered 20px on/off images; the unselected AI robot and selected pony remain unchanged; labels stay aligned; there is no clipping or horizontal overflow.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "style: balance navigation icon sizes"
```
