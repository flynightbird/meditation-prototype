# Trainer Warm Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the trainer booking page with the approved A1 warm-charcoal gradient, warm glass surfaces, centered yellow card-edge highlight, and warm booking chrome while preserving all layout and behavior.

**Architecture:** Scope all new color tokens to `.trainer-page` and consume them only from `src/trainer-booking.css`. Use a CSS pseudo-element for the booking-panel edge highlight, so the DOM and JavaScript remain unchanged; protect the work with source contracts and real-browser mobile geometry checks.

**Tech Stack:** Static CSS, Node.js built-in test runner, agent-browser mobile verification.

---

### Task 1: Establish The Warm Page Foundation

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:114-150`
- Modify: `src/trainer-booking.css:1-108`

- [ ] **Step 1: Write the failing warm-foundation contract**

Add this test after `uses the supplied map pin without dimming the map`:

```js
test("uses the approved warm charcoal trainer foundation", () => {
  assert.match(
    css,
    /\.trainer-page\s*{[^}]*--trainer-bg-from:\s*#2a211a[^}]*--trainer-bg-mid:\s*#171411[^}]*--trainer-bg-to:\s*#090b0e[^}]*--trainer-text:\s*#fffaf3[^}]*color:\s*var\(--trainer-text\)[^}]*background:\s*linear-gradient\(135deg, var\(--trainer-bg-from\) 0%, var\(--trainer-bg-mid\) 46%, var\(--trainer-bg-to\) 100%\)/s,
  );
  assert.match(
    css,
    /\.trainer-hero-shade\s*{[^}]*rgba\(42, 33, 26, 0\.52\)[^}]*rgba\(23, 20, 17, 0\.94\)/s,
  );
});
```

In `preserves the dark Hero and glass panel framework`, replace the obsolete solid-background assertion with:

```js
assert.match(css, /\.trainer-page\s*{[^}]*background:\s*linear-gradient\(135deg, var\(--trainer-bg-from\) 0%, var\(--trainer-bg-mid\) 46%, var\(--trainer-bg-to\) 100%\)/s);
```

- [ ] **Step 2: Run the focused contract and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because `.trainer-page` still uses `#0b0e14` and does not define warm trainer tokens.

- [ ] **Step 3: Add scoped tokens and the A1 page gradient**

Update the opening rules in `src/trainer-booking.css`:

```css
.trainer-page {
  --trainer-bg-from: #2a211a;
  --trainer-bg-mid: #171411;
  --trainer-bg-to: #090b0e;
  --trainer-text: #fffaf3;
  --trainer-text-muted: rgba(255, 250, 243, 0.62);
  --trainer-text-subtle: rgba(255, 250, 243, 0.38);
  --trainer-glass: rgba(255, 248, 230, 0.075);
  --trainer-glass-border: rgba(255, 236, 200, 0.16);
  --trainer-slot: rgba(255, 248, 230, 0.05);
  --trainer-slot-border: rgba(255, 236, 200, 0.11);
  --trainer-dock: rgba(22, 16, 13, 0.96);
  position: absolute;
  z-index: 15;
  inset: 0;
  overflow: hidden;
  color: var(--trainer-text);
  background: linear-gradient(135deg, var(--trainer-bg-from) 0%, var(--trainer-bg-mid) 46%, var(--trainer-bg-to) 100%);
}

.trainer-hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(42, 33, 26, 0.38), rgba(23, 20, 17, 0.06) 38%, rgba(23, 20, 17, 0.94) 100%),
    linear-gradient(90deg, rgba(42, 33, 26, 0.52), transparent 62%);
}
```

Change `.trainer-identity p` to `color: var(--trainer-text-muted);`. Keep trainer size, position, Hero height, and the hidden Hero cut unchanged.

- [ ] **Step 4: Run the focused contract and verify GREEN**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: all trainer booking contract tests PASS.

- [ ] **Step 5: Commit the page foundation**

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: warm the trainer page foundation"
```

### Task 2: Warm The Glass Components And Booking Chrome

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:123-150`
- Modify: `src/trainer-booking.css:119-175`
- Modify: `src/trainer-booking.css:186-249`
- Modify: `src/trainer-booking.css:370-554`
- Modify: `src/trainer-booking.css:569-571`

- [ ] **Step 1: Write the failing warm-component contracts**

Add these tests after the warm-foundation test:

```js
test("uses warm glass cards with a centered yellow booking edge", () => {
  assert.match(
    css,
    /\.booking-panel,\s*\.nearby-panel\s*{[^}]*border:\s*1px solid var\(--trainer-glass-border\)[^}]*background:\s*var\(--trainer-glass\)/s,
  );
  assert.match(
    css,
    /\.booking-panel::before\s*{[^}]*top:\s*0[^}]*left:\s*50%[^}]*width:\s*58%[^}]*height:\s*1px[^}]*background:\s*linear-gradient\(90deg, transparent 0%, rgba\(248, 213, 83, 0\.72\) 50%, transparent 100%\)[^}]*transform:\s*translateX\(-50%\)/s,
  );
});

test("warms booking controls and chrome while preserving map color", () => {
  assert.match(
    css,
    /\.booking-date,\s*\.booking-time\s*{[^}]*border:\s*1px solid var\(--trainer-slot-border\)[^}]*color:\s*var\(--trainer-text-muted\)[^}]*background:\s*var\(--trainer-slot\)/s,
  );
  assert.match(css, /\.booking-time:disabled\s*{[^}]*color:\s*rgba\(232, 224, 214, 0\.24\)[^}]*background:\s*rgba\(232, 224, 214, 0\.025\)/s);
  assert.match(css, /\.booking-dialog\s*{[^}]*color:\s*var\(--trainer-text\)[^}]*background:\s*linear-gradient\(170deg, #2a211a, #0d0e10\)/s);
  assert.match(css, /\.booking-action-bar\s*{[^}]*background:\s*var\(--trainer-dock\)/s);
  assert.match(css, /\.is-trainer-view \.bottom-nav\s*{[^}]*background:\s*var\(--trainer-dock\)/s);
  assert.match(css, /\.trainer-map > img\s*{[^}]*filter:\s*none[^}]*opacity:\s*1/s);
});
```

Update the existing warm-text and Dock expectations:

```js
assert.match(css, /\.nearby-heading \.nearby-summary\s*{[^}]*color:\s*var\(--trainer-text-muted\)/s);
assert.match(css, /\.store-row > span\s*{[^}]*color:\s*var\(--trainer-text-muted\)[^}]*font-size:\s*32px/s);
assert.match(css, /\.store-row\.is-closed > b\s*{[^}]*color:\s*rgba\(232, 224, 214, 0\.48\)/s);
assert.match(css, /\.is-trainer-view \.bottom-nav\s*{[^}]*background:\s*var\(--trainer-dock\)/s);
```

- [ ] **Step 2: Run the focused contract and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because cards, slots, dialog, action bar, and Dock still use the cold white/blue-black values and `.booking-panel::before` does not exist.

- [ ] **Step 3: Apply warm glass, warm text, and the yellow edge**

Update `src/trainer-booking.css` with these exact component rules:

```css
.booking-panel,
.nearby-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--trainer-glass-border);
  border-radius: 24px;
  background: var(--trainer-glass);
  box-shadow: inset 0 1px rgba(255, 248, 230, 0.08), 0 18px 42px rgba(9, 7, 6, 0.34);
  backdrop-filter: blur(24px) saturate(1.35);
}

.booking-panel::before {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 50%;
  width: 58%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(248, 213, 83, 0.72) 50%, transparent 100%);
  content: "";
  pointer-events: none;
  transform: translateX(-50%);
}

.booking-date,
.booking-time {
  border: 1px solid var(--trainer-slot-border);
  color: var(--trainer-text-muted);
  background: var(--trainer-slot);
}

.booking-time:disabled {
  color: rgba(232, 224, 214, 0.24);
  background: rgba(232, 224, 214, 0.025);
  cursor: not-allowed;
}
```

Use `var(--trainer-text-muted)` for the nearby summary and store arrows. Use `rgba(232, 224, 214, 0.48)` for the closed-store number and preserve the existing closed pin fill and dark number.

- [ ] **Step 4: Warm the fixed action bar, confirmation sheet, and Dock**

Apply these targeted replacements:

```css
.booking-action-bar {
  border-top: 1px solid var(--trainer-glass-border);
  background: var(--trainer-dock);
}

.booking-dialog {
  color: var(--trainer-text);
  background: linear-gradient(170deg, #2a211a, #0d0e10);
}

.booking-dialog::backdrop {
  background: rgba(15, 10, 8, 0.72);
}

.is-trainer-view .bottom-nav {
  background: var(--trainer-dock);
}
```

Keep the action bar’s positioning, height, grid, opacity, transition, and backdrop blur declarations. Keep the dialog size, radius, shadow, animation, content layout, and yellow confirm button unchanged. Apply these exact warm-neutral replacements:

```css
.booking-heading span { color: rgba(255, 250, 243, 0.34); }
.nearby-heading .nearby-summary { color: var(--trainer-text-muted); }
.nearby-summary i { color: rgba(255, 250, 243, 0.72); }
.store-row > span { color: var(--trainer-text-muted); }
.store-row p { color: rgba(255, 250, 243, 0.46); }
.store-row small { color: rgba(255, 250, 243, 0.3); }
.store-row.is-closed > b { color: rgba(232, 224, 214, 0.48); }
.booking-action-bar > p span { color: rgba(255, 250, 243, 0.4); }
.booking-cancel-action { color: rgba(255, 250, 243, 0.6); }
.booking-cancel-action:active { color: rgba(255, 250, 243, 0.9); }
.booking-sheet-handle { background: rgba(255, 250, 243, 0.16); }
.booking-sheet dt { color: rgba(255, 250, 243, 0.4); }
.booking-sheet-cancel {
  border-color: rgba(255, 236, 200, 0.07);
  color: rgba(255, 250, 243, 0.54);
  background: rgba(255, 248, 230, 0.04);
}
```

- [ ] **Step 5: Run focused and complete tests**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: all trainer booking contract tests PASS.

Run: `npm test`

Expected: all repository tests PASS with zero failures.

- [ ] **Step 6: Commit the warm components**

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: unify trainer booking surfaces"
```

### Task 3: Verify The Final Mobile Presentation

**Files:**
- No production files expected

- [ ] **Step 1: Start an isolated preview**

Run from the feature worktree:

```bash
python3 -m http.server 4176 --bind 127.0.0.1
```

Expected: the preview is available at `http://127.0.0.1:4176/?v=trainer-warm-a1`.

- [ ] **Step 2: Verify `375x812` and `402x874` with agent-browser**

At both viewports, navigate to the trainer page and verify:

```text
The page computes the 135deg A1 gradient and has no horizontal overflow.
The trainer image retains right -54px, top 24px, and height 150%.
The booking card retains its original geometry and shows a 1px centered 58% yellow edge.
The booking and nearby cards use the warm glass tokens.
The map image computes filter: none and opacity: 1.
The Dock remains six columns, uses the warm dock token, and its shared active capsule still moves.
The last store can scroll fully above the Dock.
```

Capture one trainer-page screenshot per viewport and inspect both for text contrast, unintended color casts on the trainer, card-edge artifacts, and overlap.

- [ ] **Step 3: Run final repository verification**

Run: `npm test`

Expected: all tests PASS with zero failures.

Run: `git diff --check main...HEAD`

Expected: no whitespace errors.

- [ ] **Step 4: Commit only if verification required a correction**

If browser verification required a CSS correction, add a failing contract for the issue, verify RED, apply the smallest CSS fix, verify GREEN, then commit:

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "fix: refine trainer warm visual contrast"
```
