# Trainer Booking Visual Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the trainer-booking Hero, date capsules, map markers, closed-store styling, bottom Dock background, and booking action spacing without changing booking behavior.

**Architecture:** Keep the existing semantic HTML and booking controller. Add the supplied map pin as a reusable local SVG asset, then express every visual change in the page-specific stylesheet; extend the existing contract suite to prevent regressions. The preview copy is updated only after source tests pass.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, SVG mask asset, Node.js built-in test runner, agent-browser mobile screenshot verification.

---

## File Map

- Create `assets/trainer-map-pin.svg` as the project-local copy of the supplied `Frame.svg`.
- Modify `src/trainer-booking.css` for Hero composition, date capsules, map treatment, closed-store badge, Dock background, and action spacing.
- Modify `tests/trainer-booking-contract.test.js` to lock the approved visuals and asset usage.
- Do not modify `src/trainer-booking.js`, `src/trainer-booking-view.js`, store content, or booking transitions.

### Task 1: Add Visual Contracts And The Supplied Pin Asset

**Files:**
- Create: `assets/trainer-map-pin.svg`
- Modify: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Add failing visual contracts**

Append these tests to `tests/trainer-booking-contract.test.js`:

```js
const mapPin = readFileSync(new URL("../assets/trainer-map-pin.svg", import.meta.url), "utf8");

test("uses the supplied map pin and lighter map treatment", () => {
  assert.match(mapPin, /viewBox="0 0 200 200"/);
  assert.match(css, /\.map-pin\s*{[^}]*mask:\s*url\("\.\.\/assets\/trainer-map-pin\.svg"\)/s);
  assert.match(css, /\.trainer-map > img\s*{[^}]*saturate\(0\.72\)[^}]*brightness\(0\.88\)[^}]*opacity:\s*0\.9/s);
  assert.match(css, /\.map-pin\.is-closed\s*{[^}]*background:\s*rgba\(255, 255, 255, 0\.38\)/s);
  assert.match(css, /\.store-row\.is-closed > b\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.52\)/s);
});

test("uses the approved full trainer and vertical date capsules", () => {
  assert.match(css, /\.trainer-hero > img\s*{[^}]*width:\s*auto[^}]*height:\s*100%[^}]*object-fit:\s*contain[^}]*object-position:\s*right bottom/s);
  assert.match(css, /\.booking-date\s*{[^}]*height:\s*68px[^}]*border-radius:\s*999px/s);
  assert.match(css, /\.booking-date strong\s*{[^}]*width:\s*28px[^}]*height:\s*28px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.booking-date\[aria-pressed="true"\]\s*{[^}]*color:\s*#16130b[^}]*background:\s*#f8d553/s);
});

test("extends the trainer background through the Dock and separates actions", () => {
  assert.match(css, /\.is-trainer-view \.bottom-nav\s*{[^}]*background:\s*rgba\(11, 14, 20, 0\.96\)/s);
  assert.match(css, /\.booking-action-bar > div\s*{[^}]*gap:\s*14px/s);
  assert.match(css, /\.booking-cancel-action\s*{[^}]*background:\s*transparent/s);
});
```

- [ ] **Step 2: Run the contract and verify failure**

Run:

```bash
node --test tests/trainer-booking-contract.test.js
```

Expected: FAIL because `assets/trainer-map-pin.svg` and the new CSS declarations do not exist.

- [ ] **Step 3: Copy the exact supplied SVG into the project**

Run:

```bash
cp /Users/admin/Downloads/Frame.svg assets/trainer-map-pin.svg
```

Expected: `assets/trainer-map-pin.svg` contains the `200×200` pin path from the supplied file.

- [ ] **Step 4: Commit the failing contracts and asset**

```bash
git add assets/trainer-map-pin.svg tests/trainer-booking-contract.test.js
git commit -m "test: specify trainer booking visual refinement"
```

### Task 2: Implement The Approved Visual Refinement

**Files:**
- Modify: `src/trainer-booking.css`
- Test: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Update the Hero and date controls**

Replace the relevant rules with:

```css
.trainer-hero > img {
  position: absolute;
  right: -4px;
  bottom: 0;
  width: auto;
  height: 100%;
  object-fit: contain;
  object-position: right bottom;
}

.booking-date {
  display: grid;
  min-width: 0;
  height: 68px;
  padding: 7px 0 6px;
  place-items: center;
  border-radius: 999px;
  font-size: 9px;
}

.booking-date strong {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  font-size: 15px;
  font-weight: 400;
}

.booking-date[aria-pressed="true"] {
  border-color: #f8d553;
  color: #16130b;
  background: #f8d553;
  box-shadow: 0 0 16px rgba(248, 213, 83, 0.18);
}

.booking-date[aria-pressed="true"] strong {
  background: rgba(255, 255, 255, 0.56);
}

.booking-time[aria-pressed="true"] {
  border-color: rgba(248, 213, 83, 0.52);
  color: #f8d553;
  background: rgba(248, 213, 83, 0.13);
  box-shadow: 0 0 13px rgba(248, 213, 83, 0.12);
}
```

- [ ] **Step 2: Update the map and closed-store styles**

Replace the current map image and pin rules with:

```css
.trainer-map > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.72) brightness(0.88);
  opacity: 0.9;
}

.map-pin {
  position: absolute;
  display: grid;
  width: 26px;
  height: 32px;
  padding-bottom: 5px;
  place-items: center;
  color: #0b0e14;
  background: #f8d553;
  mask: url("../assets/trainer-map-pin.svg") center / contain no-repeat;
  filter: drop-shadow(0 0 7px rgba(248, 213, 83, 0.48));
  font-size: 9px;
}

.map-pin.is-closed {
  color: rgba(11, 14, 20, 0.7);
  background: rgba(255, 255, 255, 0.38);
  filter: none;
}

.store-row.is-closed > b {
  border-color: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.52);
  background: rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 3: Update Dock and action hierarchy**

Add or update:

```css
.booking-action-bar > div {
  display: flex;
  align-items: center;
  gap: 14px;
}

.booking-cancel-action:active {
  color: rgba(255, 255, 255, 0.9);
}

.is-trainer-view .bottom-nav {
  background: rgba(11, 14, 20, 0.96);
}
```

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/trainer-booking-contract.test.js
npm test
git diff --check
```

Expected: all trainer contracts and the full suite PASS; `git diff --check` prints nothing.

- [ ] **Step 5: Commit the CSS implementation**

```bash
git add src/trainer-booking.css
git commit -m "feat: refine trainer booking visuals"
```

### Task 3: Sync And Verify The Persistent Preview

**Files:**
- Modify only if visual verification finds a defect: `src/trainer-booking.css`, `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Sync the source into the persistent preview copy**

Run:

```bash
rsync -a --exclude='.git' --exclude='output' /Users/admin/Documents/田田/.worktrees/private-trainer-booking/ /tmp/trainer-booking-preview-site-4175/
```

Expected: `http://127.0.0.1:4175/?v=trainer-visual-refinement` serves the latest source.

- [ ] **Step 2: Verify 402×874 states**

Use agent-browser to open the preview, enter `预约私教`, capture the initial state, then select an available time.

Expected: complete right-aligned trainer; solid-yellow selected date capsule with circular date surface; lighter map with SVG pins; gray third pin and third list badge; black Dock; text-only cancel with a 14px action gap.

- [ ] **Step 3: Verify 375×812 layout**

Repeat at 375×812 and scroll to the bottom.

Expected: no horizontal overflow, no clipped date labels, no overlap in the action bar, and the final store row remains reachable above the Dock.

- [ ] **Step 4: Run final regression checks**

Run:

```bash
npm test
git diff --check
git status --short --untracked-files=no
```

Expected: all tests PASS, diff check is silent, and tracked source is clean.

- [ ] **Step 5: Commit verification fixes only if needed**

If verification changes source:

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "fix: polish trainer booking mobile refinement"
```

Do not create an empty commit if no fixes are required.
