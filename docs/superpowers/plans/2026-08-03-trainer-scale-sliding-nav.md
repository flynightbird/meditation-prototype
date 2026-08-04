# Trainer Scale And Sliding Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge and reposition the trainer without bottom clipping, establish the approved 90px identity-to-card spacing, and animate one shared navigation capsule between Tabs.

**Architecture:** Keep the existing booking DOM and state model. Let the oversized trainer image overflow its fixed-height Hero behind the higher-stacking booking content; drive a CSS pseudo-element indicator from a percentage custom property updated by the existing `setActiveNavigation()` function.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js test runner, agent-browser.

---

## File Map

- Modify `tests/trainer-booking-contract.test.js`: lock the 1.5x trainer scale, non-clipping overflow, right/down placement, identity spacing, and foreground card stacking.
- Modify `tests/visual-contract.test.js`: lock the shared capsule geometry, spring transition, active-index update, and reduced-motion fallback.
- Modify `src/trainer-booking.css`: implement oversized overflowing trainer geometry and approved copy spacing.
- Modify `src/styles.css`: replace per-Tab active backgrounds with one translating pseudo-element.
- Modify `src/app.js`: update the shared capsule position when the active navigation item changes.

### Task 1: Add Failing Contracts

**Files:**
- Modify: `tests/trainer-booking-contract.test.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Replace the current trainer-position contract**

Replace the trainer geometry assertions in `positions the trainer behind the booking card and strengthens store cues` with:

```js
assert.match(css, /\.trainer-scroll\s*{[^}]*overflow-x:\s*hidden/s);
assert.match(css, /\.trainer-hero\s*{[^}]*overflow:\s*visible/s);
assert.match(css, /\.trainer-hero > img\s*{[^}]*right:\s*-54px[^}]*top:\s*24px[^}]*bottom:\s*auto[^}]*height:\s*150%/s);
assert.match(css, /\.trainer-hero-cut\s*{[^}]*display:\s*none/s);
assert.match(css, /\.trainer-content\s*{[^}]*position:\s*relative[^}]*z-index:\s*2[^}]*margin-top:\s*-20px/s);
assert.match(css, /\.trainer-identity\s*{[^}]*bottom:\s*110px/s);
assert.match(css, /\.trainer-identity h1\s*{[^}]*margin:\s*12px 0 12px/s);
```

Keep the existing nearby-heading and store-arrow assertions in the same test.

- [ ] **Step 2: Add the shared navigation capsule assertions**

In the six-Tab visual contract, replace the active background assertion with:

```js
assert.match(css, /\.bottom-nav\s*{[^}]*--nav-indicator-x:\s*0%[^}]*isolation:\s*isolate/s);
assert.match(css, /\.bottom-nav::before\s*{[^}]*top:\s*8px[^}]*bottom:\s*8px[^}]*left:\s*8px[^}]*width:\s*calc\(\(100% - 16px\) \/ 6\)[^}]*border-radius:\s*999px[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)[^}]*transform:\s*translateX\(var\(--nav-indicator-x\)\)[^}]*transition:\s*transform 300ms cubic-bezier\(0\.22, 1\.18, 0\.36, 1\)/s);
assert.match(css, /\.nav-item\s*{[^}]*position:\s*relative[^}]*z-index:\s*1/s);
assert.match(css, /\.nav-item\.is-active\s*{[^}]*border-radius:\s*999px[^}]*background:\s*transparent/s);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.bottom-nav::before\s*{[^}]*transition:\s*none !important/s);
assert.match(app, /function setActiveNavigation\(nav\)[\s\S]*activeIndex[\s\S]*--nav-indicator-x[\s\S]*`\$\{activeIndex \* 100\}%`/s);
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node --test tests/trainer-booking-contract.test.js tests/visual-contract.test.js
```

Expected: FAIL because the trainer is still `100%` high and Hero-clipped, the identity spacing is not `90px`/`12px`, and the active background is still attached to each Tab.

- [ ] **Step 4: Commit the failing tests**

```bash
git add tests/trainer-booking-contract.test.js tests/visual-contract.test.js
git commit -m "test: define trainer scale and sliding nav"
```

### Task 2: Enlarge Trainer Without Bottom Clipping

**Files:**
- Modify: `src/trainer-booking.css`
- Test: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Allow controlled Hero overflow**

Update the scrolling and Hero rules:

```css
.trainer-scroll {
  height: 100%;
  overflow: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.trainer-hero {
  position: relative;
  height: 320px;
  overflow: visible;
}
```

- [ ] **Step 2: Scale and position the trainer**

Update the image rule without using `transform: scale()`:

```css
.trainer-hero > img {
  position: absolute;
  right: -54px;
  top: 24px;
  bottom: auto;
  width: auto;
  height: 150%;
  object-fit: contain;
  object-position: right top;
}
```

This keeps the top of the visible image inside the Hero, moves the full asset down/right, and allows its lower portion to extend behind the card instead of being clipped.

- [ ] **Step 3: Remove the old diagonal crop and apply copy spacing**

Update the existing rules to:

```css
.trainer-identity { bottom: 110px; }

.trainer-identity h1 {
  margin: 12px 0 12px;
}

.trainer-hero-cut {
  display: none;
}
```

The existing booking panel begins at `300px` because `.trainer-content` retains `margin-top: -20px`; an identity bottom at `210px` creates the approved `90px` gap.

- [ ] **Step 4: Run the trainer contract and verify GREEN**

Run:

```bash
node --test tests/trainer-booking-contract.test.js
```

Expected: all trainer booking contract tests PASS.

- [ ] **Step 5: Commit the trainer changes**

```bash
git add src/trainer-booking.css
git commit -m "style: enlarge trainer behind booking card"
```

### Task 3: Add The Shared Sliding Capsule

**Files:**
- Modify: `src/styles.css`
- Modify: `src/app.js`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Add one shared indicator to the Dock**

Add the custom property and stacking context to `.bottom-nav`, then add:

```css
.bottom-nav {
  --nav-indicator-x: 0%;
  isolation: isolate;
}

.bottom-nav::before {
  position: absolute;
  z-index: 0;
  top: 8px;
  bottom: 8px;
  left: 8px;
  width: calc((100% - 16px) / 6);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  content: "";
  pointer-events: none;
  transform: translateX(var(--nav-indicator-x));
  transition: transform 300ms cubic-bezier(0.22, 1.18, 0.36, 1);
}
```

- [ ] **Step 2: Place Tab content above the indicator**

Update the relevant declarations:

```css
.nav-item {
  position: relative;
  z-index: 1;
}

.nav-item.is-active {
  border-radius: 999px;
  background: transparent;
}
```

Keep the existing active icon and label color rules.

- [ ] **Step 3: Move the indicator from the existing navigation setter**

Replace `setActiveNavigation()` with:

```js
function setActiveNavigation(nav) {
  const items = [...bottomNav.querySelectorAll(".nav-item")];
  const activeIndex = items.findIndex((item) => item.dataset.nav === nav);
  if (activeIndex >= 0) {
    bottomNav.style.setProperty("--nav-indicator-x", `${activeIndex * 100}%`);
  }

  items.forEach((item) => {
    const active = item.dataset.nav === nav;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}
```

- [ ] **Step 4: Add reduced-motion behavior**

Inside the existing `@media (prefers-reduced-motion: reduce)` block add:

```css
.bottom-nav::before {
  transition: none !important;
}
```

- [ ] **Step 5: Run the visual contract and verify GREEN**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: all visual contract tests PASS.

- [ ] **Step 6: Commit the navigation motion**

```bash
git add src/styles.css src/app.js
git commit -m "feat: animate the active navigation capsule"
```

### Task 4: Verify Composition And Motion

**Files:**
- Verify: `src/trainer-booking.css`
- Verify: `src/styles.css`
- Verify: `src/app.js`
- Verify: `tests/trainer-booking-contract.test.js`
- Verify: `tests/visual-contract.test.js`

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm test
```

Expected: all tests PASS with no failures or warnings.

- [ ] **Step 2: Check whitespace and branch status**

Run:

```bash
git diff --check main...HEAD
git status --short --branch
```

Expected: no diff errors and a clean `codex/trainer-visual-hierarchy` worktree.

- [ ] **Step 3: Sync the persistent preview**

Run:

```bash
rsync -a --exclude=.git --exclude=output ./ /tmp/trainer-booking-preview-site-4175/
```

Expected: `http://127.0.0.1:4175/?v=trainer-scale-nav-motion` serves the updated build.

- [ ] **Step 4: Verify both mobile viewports with agent-browser**

At `375x812` and `402x874`, confirm:

```text
- visible trainer scale is approximately 1.5x the previous implementation;
- headroom remains between 24px and 32px;
- the trainer extends below the Hero and is covered by the foreground booking card, not clipped at the Hero boundary;
- the identity block ends 90px above the booking card and its supporting line sits 12px below the title;
- the shared capsule slides between AI教练 and 预约私教 in about 300ms with one mild settle;
- no second active background appears;
- reduced-motion mode switches without sliding;
- no horizontal overflow;
- the final store remains reachable above the Dock.
```

- [ ] **Step 5: Commit any verification-driven correction**

Only when the visual check requires a correction, update the corresponding contract first, verify it fails for the expected reason, then commit the test and CSS/JS correction together:

```bash
git add tests/trainer-booking-contract.test.js tests/visual-contract.test.js src/trainer-booking.css src/styles.css src/app.js
git commit -m "fix: tune trainer scale and navigation motion"
```
