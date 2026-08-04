# Meditation UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide growth stats during the meditation countdown, add breathing room below direct message titles, and add attribute icons to collectible growth bubbles.

**Architecture:** Reuse the existing `data-screen` state and growth-stat model. CSS controls the active-screen transition and layout; `render()` synchronizes accessibility state, while the existing `getGrowthStatItem()` supplies each bubble icon without duplicating asset mappings.

**Tech Stack:** Vanilla JavaScript, CSS, Node.js built-in test runner, agent-browser.

---

## File Map

- Modify `tests/visual-contract.test.js`: define the three UI contracts before implementation.
- Modify `src/app.js`: synchronize growth-stat accessibility and render icon-plus-label bubble rows.
- Modify `src/styles.css`: hide active-screen stats, set title spacing, and style bubble labels.

### Task 1: Define The UI Contracts

**Files:**
- Modify: `tests/visual-contract.test.js:433-490`

- [ ] **Step 1: Add the active-only growth-stat contract**

Extend the growth-stat test with:

```js
assert.match(css, /\.app-shell\[data-screen="active"\] \.growth-stats\s*{[^}]*opacity:\s*0[^}]*visibility:\s*hidden/s);
assert.match(app, /growthStats\.setAttribute\("aria-hidden",\s*String\(state\.screen === "active"\)\)/);
```

- [ ] **Step 2: Add the message-spacing contract**

Add:

```js
test("adds breathing room below direct message titles", () => {
  assert.match(css, /\.message h1 \+ \.supporting\s*{[^}]*margin-top:\s*8px/s);
});
```

- [ ] **Step 3: Add the bubble icon-row contract**

Extend the collectible bubble test with:

```js
assert.match(app, /class="growth-bubble-label"[\s\S]*getGrowthStatItem\(bubble\.attribute\)\.icon[\s\S]*<small>\$\{ATTRIBUTE_LABELS\[bubble\.attribute\]\}<\/small>/);
assert.match(css, /\.growth-bubble-label\s*{[^}]*display:\s*inline-flex[^}]*gap:\s*3px/s);
assert.match(css, /\.growth-bubble-label img\s*{[^}]*width:\s*12px[^}]*height:\s*12px/s);
```

- [ ] **Step 4: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: failures for the missing active-screen rule, accessibility update, title spacing, and bubble icon row.

- [ ] **Step 5: Commit the failing contracts**

```bash
git add tests/visual-contract.test.js
git commit -m "test: define meditation UI refinements"
```

### Task 2: Implement The Refined States And Layout

**Files:**
- Modify: `src/app.js:135-151`
- Modify: `src/app.js:582-590`
- Modify: `src/styles.css:341-375`
- Modify: `src/styles.css:383-496`
- Modify: `src/styles.css:570-590`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Render the icon-plus-label row**

Replace the bubble label markup with:

```js
<span class="growth-bubble-label">
  <img src="${getGrowthStatItem(bubble.attribute).icon}" alt="" />
  <small>${ATTRIBUTE_LABELS[bubble.attribute]}</small>
</span>
<strong>+${bubble.value}</strong>
```

- [ ] **Step 2: Synchronize the active-screen accessibility state**

Immediately after assigning `app.dataset.screen` in `render()` add:

```js
growthStats.setAttribute("aria-hidden", String(state.screen === "active"));
```

- [ ] **Step 3: Add the scoped title spacing**

After `.message h1`, add:

```css
.message h1 + .supporting {
  margin-top: 8px;
}
```

- [ ] **Step 4: Hide growth stats only during the countdown**

Add transitions to `.growth-stats` and the state rule:

```css
.growth-stats {
  transition: opacity 180ms ease, visibility 180ms;
}

.app-shell[data-screen="active"] .growth-stats {
  visibility: hidden;
  opacity: 0;
}
```

- [ ] **Step 5: Style the bubble label row**

Add:

```css
.growth-bubble-label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.growth-bubble-label img {
  width: 12px;
  height: 12px;
  object-fit: contain;
}
```

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
node --test tests/visual-contract.test.js
npm test
git diff --check
```

Expected: all tests pass and the diff check produces no output.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/app.js src/styles.css
git commit -m "style: refine meditation stats and rewards"
```

### Task 3: Verify The Meditation Flow In Browser

**Files:**
- Verify: `index.html`
- Verify: `src/app.js`
- Verify: `src/styles.css`

- [ ] **Step 1: Verify recommendation and countdown states**

At `402x874`, confirm the three growth stats are visible on recommendation. Click `开始冥想` and confirm they become invisible and `aria-hidden="true"` only on the active countdown.

- [ ] **Step 2: Verify immediate restoration**

End the meditation or complete the countdown and confirm the three stats restore immediately on completion with `aria-hidden="false"`.

- [ ] **Step 3: Verify title spacing**

Reach meal preparation and confirm the direct `h1 + .supporting` gap computes to `8px` without overlap or excessive displacement.

- [ ] **Step 4: Verify reward bubble labels**

Render pending rewards and confirm each visible bubble has the correct `12px` attribute icon beside its label with a `3px` gap, while the reward value remains on the second row.

- [ ] **Step 5: Capture and inspect evidence**

Save screenshots for recommendation, active countdown, completion, meal preparation, and visible bubbles under `/tmp/meditation-ui-refinement-*.png`. Check browser console and page errors.

- [ ] **Step 6: Check final repository state**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests pass, diff check is clean, and no tracked changes remain after commits.
