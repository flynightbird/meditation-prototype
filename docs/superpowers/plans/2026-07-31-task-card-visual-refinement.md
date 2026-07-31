# Task Card Visual Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the recommendation copy and daily task rail so text, icons, completion marks, and the primary action have clear hierarchy and spacing.

**Architecture:** Keep the existing state and schedule data unchanged. Add a semantic task footer wrapper in the card template, then express the approved three-row layout, glass materials, and vertical rhythm entirely through scoped CSS.

**Tech Stack:** HTML template strings, CSS, Node.js built-in test runner, agent-browser

---

### Task 1: Lock the visual contract

**Files:**
- Create: `tests/visual-contract.test.js`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Write the failing source contract tests**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("task cards reserve a footer row for label and completion state", () => {
  assert.match(app, /class="task-footer"/);
  assert.match(css, /\.task-footer\s*{/);
  assert.match(css, /gap:\s*2px/);
});

test("current card uses the approved diagonal glass gradient without an outline", () => {
  assert.match(css, /linear-gradient\(135deg,\s*rgba\(255,\s*241,\s*138/);
  assert.match(css, /rgba\(212,\s*243,\s*255/);
  assert.doesNotMatch(css, /\.task-card\.is-current[^}]*inset 0 0 0 2px/s);
});

test("supporting recommendation copy uses regular weight", () => {
  assert.match(css, /\.supporting\s*{[^}]*font-weight:\s*400/s);
});
```

- [ ] **Step 2: Run the contract tests and confirm failure**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because `.task-footer` and the approved gradient do not exist yet.

- [ ] **Step 3: Commit the failing contract tests**

```bash
git add tests/visual-contract.test.js
git commit -m "test: define task card visual contract"
```

### Task 2: Restructure card internals and apply approved styling

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Group the task name and completion indicator**

Replace the separate label and completion nodes in `taskCard()` with:

```js
<span class="task-footer">
  <strong>${label}</strong>
  ${done ? '<span class="check" aria-hidden="true">✓</span>' : ""}
</span>
```

Keep the current label as its own top-right metadata element.

- [ ] **Step 2: Implement the fixed three-row card layout**

Update the card styles to use explicit rows and a 2px gap:

```css
.task-card {
  grid-template-rows: 12px minmax(0, 1fr) 16px;
  row-gap: 2px;
  background: rgba(255, 255, 255, 0.6);
}

.task-footer {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.task-footer strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card .check {
  position: static;
  flex: 0 0 16px;
  width: 16px;
}
```

- [ ] **Step 3: Apply the current-card material and metadata alignment**

Use a 135-degree translucent gradient, no yellow outline, and preserve the colored `当前` label:

```css
.task-card.is-current {
  grid-template-rows: 14px minmax(0, 1fr) 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 241, 138, 0.86),
    rgba(212, 243, 255, 0.76)
  );
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.72), 0 6px 12px rgba(29, 15, 7, 0.14);
  backdrop-filter: blur(18px) saturate(1.18);
}

.task-card.is-current time {
  justify-self: start;
}

.is-current .task-visual {
  width: 64px;
  height: 50px;
  transform: translateY(-2px);
}
```

Keep `.current-label` positioned at the top right with its existing colored background.

- [ ] **Step 4: Refine copy weight and button spacing**

Set `.supporting { font-weight: 400; }`. Move `.action-zone` upward by 17px in the default layout and the short-height media query so the button has approximately 14px of clear separation from the current card.

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: all state, experience, and visual contract tests pass.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/app.js src/styles.css
git commit -m "style: refine task card hierarchy and glass surface"
```

### Task 3: Verify mobile rendering and interaction

**Files:**
- Verify: `src/app.js`
- Verify: `src/styles.css`

- [ ] **Step 1: Verify syntax and automated tests**

Run:

```bash
npm test
node --check src/app.js
```

Expected: all tests pass and syntax check exits 0.

- [ ] **Step 2: Verify the 402 x 874 recommendation state**

Open `http://127.0.0.1:4173`, set the viewport to `402 874`, clear local storage, reload, skip the welcome animation, and capture a screenshot.

Confirm:

- Current card has no outer outline.
- `15:30` is left aligned and `当前` retains its colored background on the right.
- Icon and task name do not overlap.
- Completed label and checkmark share one footer row with a 2px gap.
- Button and current card have at least 14px of visible separation.

- [ ] **Step 3: Verify the 375 x 812 recommendation state**

Set the viewport to `375 812` and capture a screenshot. Confirm the same requirements with no clipping or overlap.

- [ ] **Step 4: Verify schedule states and browser errors**

Complete meditation and confirm the next current task uses the same layout. Inspect browser console and page errors; expected result is no errors.

- [ ] **Step 5: Commit any verification corrections**

```bash
git add src/app.js src/styles.css tests/visual-contract.test.js
git commit -m "fix: tune task card spacing after mobile verification"
```
