# Trainer Visual Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the trainer booking Hero, map markers, store affordances, and six-Tab Dock hierarchy without redesigning the existing black-and-yellow interface.

**Architecture:** Keep the existing HTML and booking state model unchanged. Add regression contracts around the approved CSS values, then make focused styling changes in `trainer-booking.css` and `styles.css`; verify the final composition in the persistent local preview at two mobile viewport sizes.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js test runner, agent-browser.

---

## File Map

- Modify `tests/trainer-booking-contract.test.js`: lock the trainer position, card overlap, unfiltered map, pin typography, heading count, and store arrow treatment.
- Modify `tests/visual-contract.test.js`: lock the Dock top radius and active Tab capsule radius.
- Modify `src/trainer-booking.css`: implement the approved trainer, map, pin, count, and arrow styles.
- Modify `src/styles.css`: implement the approved Dock and selected Tab radii.

### Task 1: Add Failing Visual Contracts

**Files:**
- Modify: `tests/trainer-booking-contract.test.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Replace the old map-treatment assertion and add the trainer hierarchy contract**

Replace the current `uses the supplied map pin and lighter map treatment` test with:

```js
test("uses the supplied map pin without dimming the map", () => {
  assert.match(mapPin, /viewBox="0 0 200 200"/);
  assert.match(css, /\.map-pin::before\s*{[^}]*mask:\s*url\("\.\.\/assets\/trainer-map-pin\.svg"\)/s);
  assert.match(css, /\.map-pin\s*{[^}]*isolation:\s*isolate[^}]*color:\s*#745400[^}]*font-size:\s*9px[^}]*font-weight:\s*600/s);
  assert.match(css, /\.trainer-map > img\s*{[^}]*filter:\s*none[^}]*opacity:\s*1/s);
  assert.match(css, /\.map-pin\.is-closed\s*{[^}]*--pin-fill:\s*rgba\(205, 211, 219, 0\.72\)[^}]*color:\s*#3f4650/s);
  assert.match(css, /\.store-row\.is-closed > b\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.52\)/s);
});

test("positions the trainer behind the booking card and strengthens store cues", () => {
  assert.match(css, /\.trainer-hero > img\s*{[^}]*right:\s*-24px[^}]*bottom:\s*-24px[^}]*height:\s*100%/s);
  assert.match(css, /\.trainer-content\s*{[^}]*position:\s*relative[^}]*z-index:\s*2[^}]*margin-top:\s*-20px/s);
  assert.match(css, /\.nearby-heading span\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.62\)/s);
  assert.match(css, /\.store-row > span\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.62\)[^}]*font-size:\s*32px/s);
});
```

Update the existing six-Tab test in `tests/visual-contract.test.js` with these assertions:

```js
assert.match(css, /\.bottom-nav\s*{[^}]*border-radius:\s*32px 32px 0 0/s);
assert.match(css, /\.nav-item\.is-active\s*{[^}]*border-radius:\s*999px[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/s);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/trainer-booking-contract.test.js tests/visual-contract.test.js
```

Expected: FAIL because the current CSS still dims the map, uses normal-weight dark pin text, positions the trainer at `right: -4px; bottom: 0`, uses weak store cues, and retains `22px`/`16px` navigation radii.

- [ ] **Step 3: Commit the failing contracts**

```bash
git add tests/trainer-booking-contract.test.js tests/visual-contract.test.js
git commit -m "test: define trainer visual hierarchy"
```

### Task 2: Implement Trainer and Map Hierarchy

**Files:**
- Modify: `src/trainer-booking.css`
- Test: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Move the full-size trainer and overlap the booking card**

Update the relevant rules to:

```css
.trainer-hero > img {
  position: absolute;
  right: -24px;
  bottom: -24px;
  width: auto;
  height: 100%;
  object-fit: contain;
  object-position: right bottom;
}

.trainer-content {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 14px;
  margin-top: -20px;
  padding: 0 14px 94px;
}
```

This preserves the image scale, moves it right and down to create headroom, and lets the booking card visually cover the lower body.

- [ ] **Step 2: Remove map dimming and strengthen pin typography**

Update the relevant rules to:

```css
.trainer-map > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
  opacity: 1;
}

.map-pin {
  color: #745400;
  font-size: 9px;
  font-weight: 600;
}

.map-pin.is-closed {
  --pin-fill: rgba(205, 211, 219, 0.72);
  color: #3f4650;
  filter: none;
}
```

Keep every other existing `.map-pin` declaration unchanged.

- [ ] **Step 3: Strengthen the count and arrow affordances**

Separate the shared heading selector and update the store arrow:

```css
.booking-heading span {
  color: rgba(255, 255, 255, 0.34);
  font-size: 10px;
}

.nearby-heading span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
}

.store-row > span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 32px;
}
```

- [ ] **Step 4: Run the trainer contract and verify GREEN**

Run:

```bash
node --test tests/trainer-booking-contract.test.js
```

Expected: all trainer booking contract tests PASS.

- [ ] **Step 5: Commit the trainer visual changes**

```bash
git add src/trainer-booking.css
git commit -m "style: refine trainer and store hierarchy"
```

### Task 3: Implement Dock Rounding

**Files:**
- Modify: `src/styles.css`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Update Dock and selected Tab radii**

Change the Dock radius and add the active capsule radius:

```css
.bottom-nav {
  border-radius: 32px 32px 0 0;
}

.nav-item.is-active {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}
```

Keep the existing `.nav-item` geometry, Dock height, padding, and selected colors unchanged.

- [ ] **Step 2: Run the visual contract and verify GREEN**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: all visual contract tests PASS.

- [ ] **Step 3: Commit the Dock changes**

```bash
git add src/styles.css
git commit -m "style: round the trainer Dock selection"
```

### Task 4: Full Verification and Preview

**Files:**
- Verify: `src/trainer-booking.css`
- Verify: `src/styles.css`
- Verify: `tests/trainer-booking-contract.test.js`
- Verify: `tests/visual-contract.test.js`

- [ ] **Step 1: Run all automated tests**

Run:

```bash
npm test
```

Expected: all tests PASS with no failures or warnings.

- [ ] **Step 2: Check the diff for whitespace errors**

Run:

```bash
git diff --check main...HEAD
```

Expected: no output.

- [ ] **Step 3: Sync the persistent preview**

Run:

```bash
rsync -a --exclude=.git --exclude=output ./ /tmp/trainer-booking-preview-site-4175/
```

Expected: `http://127.0.0.1:4175/?v=trainer-hierarchy` serves the updated build.

- [ ] **Step 4: Verify mobile composition with agent-browser**

At both `375x812` and `402x874`, open the trainer page and confirm:

```text
- trainer face and arms remain unobstructed;
- trainer scale is unchanged, with new right shift and headroom;
- booking panel overlaps only the lower body;
- map is undimmed;
- open and closed pin numbers are 600 and visibly distinct;
- “共 3 家” and all three arrows are legible;
- Dock top corners are 32px and the active Tab is a full capsule;
- no horizontal overflow;
- the final store ends above the Dock at maximum scroll.
```

- [ ] **Step 5: Commit any verification-driven correction**

Only if a correction is necessary:

```bash
git add src/trainer-booking.css src/styles.css tests/trainer-booking-contract.test.js tests/visual-contract.test.js
git commit -m "fix: tune trainer mobile composition"
```
