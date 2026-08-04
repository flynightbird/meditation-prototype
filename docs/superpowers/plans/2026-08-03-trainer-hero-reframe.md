# Trainer Hero Reframe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge and reposition the trainer, add the selected B2 lower Hero overlay, and remove only the divider directly below the map.

**Architecture:** Keep the DOM and booking behavior unchanged. Update trainer image geometry, add the transition through `.trainer-hero-shade::after`, and remove the first store divider with a structural selector. Protect exact values with the existing Node source-contract suite and real-browser mobile checks.

**Tech Stack:** Static CSS, Node.js built-in test runner, browser mobile viewport verification.

---

### Task 1: Reframe The Trainer Hero And First Store Boundary

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:157-174`
- Modify: `src/trainer-booking.css:41-77`
- Modify: `src/trainer-booking.css:343-352`

- [ ] **Step 1: Write the failing trainer composition contract**

Replace the obsolete image geometry assertions and add the overlay and divider assertions:

```js
assert.match(css, /\.trainer-hero > img\s*{[^}]*right:\s*-112px[^}]*top:\s*64px[^}]*bottom:\s*auto[^}]*height:\s*175%/s);
assert.match(css, /\.trainer-hero-shade::after\s*{[^}]*top:\s*220px[^}]*height:\s*400px[^}]*rgba\(23, 20, 17, 0\.94\) 38%[^}]*rgba\(23, 20, 17, 0\.94\) 100%[^}]*pointer-events:\s*none/s);
assert.match(css, /\.store-list \.store-row:first-child\s*{[^}]*border-top:\s*0/s);
assert.match(css, /\.trainer-hero > img\s*{[^}]*width:\s*auto[^}]*height:\s*175%[^}]*object-fit:\s*contain[^}]*object-position:\s*right top/s);
```

Keep all existing assertions for Hero overflow, content stacking, identity placement, nearby-store cues, and date capsules.

- [ ] **Step 2: Run the focused contract and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because production still uses `right: -54px`, `top: 24px`, and `height: 150%`, has no lower overlay, and retains the first divider.

- [ ] **Step 3: Implement the approved B2 composition**

Update the trainer image geometry:

```css
.trainer-hero > img {
  position: absolute;
  right: -112px;
  top: 64px;
  bottom: auto;
  width: auto;
  height: 175%;
  object-fit: contain;
  object-position: right top;
}
```

Add the stronger page-level lower overlay after `.trainer-hero-shade`:

```css
.trainer-hero-shade::after {
  position: absolute;
  top: 220px;
  right: 0;
  left: 0;
  height: 400px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(23, 20, 17, 0.46) 20%,
    rgba(23, 20, 17, 0.94) 38%,
    rgba(23, 20, 17, 0.94) 100%
  );
  content: "";
  pointer-events: none;
}
```

Remove only the divider below the map:

```css
.store-list .store-row:first-child { border-top: 0; }
```

- [ ] **Step 4: Run the focused contract and verify GREEN**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: all trainer booking contract tests PASS.

- [ ] **Step 5: Run the complete repository test suite**

Run: `npm test`

Expected: all repository tests PASS with zero failures.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: strengthen trainer hero composition"
```

### Task 2: Verify Mobile Composition

**Files:**
- Inspect: `index.html`
- Inspect: `src/trainer-booking.css`

- [ ] **Step 1: Start an isolated local preview**

Run: `python3 -m http.server 4178 --bind 127.0.0.1`

Expected: preview is available at `http://127.0.0.1:4178/` without changing project files.

- [ ] **Step 2: Check the 375x812 viewport**

Verify these computed conditions:

```text
document.documentElement.scrollWidth === 375
trainer image right === -112px
trainer image top === 64px
trainer image height === 560px
first store row border-top-width === 0px
```

Capture a screenshot and inspect that the head remains visible, about two-fifths of the right arm is cropped, identity copy is unobstructed, and the lower Hero darkens before the booking card.

- [ ] **Step 3: Check the 402x874 viewport**

Verify these computed conditions:

```text
document.documentElement.scrollWidth === 402
app shell width === 402px
Dock width === 402px
second and third store rows retain their separators
```

Capture a screenshot and inspect that coach identity and booking-card geometry remain unchanged.

- [ ] **Step 4: Run final verification**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests pass, there are no whitespace errors, and only intentional plan or implementation changes remain.
