# Confirmed Booking State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a confirmed trainer appointment a persistent honey-yellow date marker and a full-yellow checked time cell without confusing it with temporary selection or generic unavailability.

**Architecture:** Keep `confirmedBooking` as the single source of truth. The booking view derives `data-confirmed` attributes and accessible labels during its existing render pass, while CSS gives those attributes higher visual priority than disabled styles. No new state, event, or cancellation behavior is introduced.

**Tech Stack:** Vanilla JavaScript, CSS, Node.js test runner, Playwright CLI

---

### Task 1: Add the confirmed-booking rendering contract

**Files:**
- Modify: `tests/trainer-booking-contract.test.js`
- Modify: `src/trainer-booking-view.js`

- [ ] **Step 1: Write the failing contract test**

Add a test that requires both date and time renderers to derive a dedicated confirmation state and requires an explicit accessible label for the confirmed time:

```js
test("marks the confirmed date and time independently from selection and availability", () => {
  assert.match(view, /const confirmed = date\.key === state\.confirmedBooking\?\.dateKey/);
  assert.match(view, /button\.dataset\.confirmed = String\(confirmed\)/);
  assert.match(view, /const confirmed = state\.confirmedBooking\?\.dateKey === state\.selectedDateKey &&[\s\S]*state\.confirmedBooking\.time === time/);
  assert.match(view, /confirmed \? `\$\{time\}，已预约` : unavailable \? `\$\{time\}，不可预约` : `\$\{time\}，可预约`/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because `renderDates()` and `renderTimes()` do not set `data-confirmed` or distinguish the confirmed accessible label.

- [ ] **Step 3: Derive confirmed states in the existing render functions**

In `renderDates()`, calculate and expose confirmation independently from `aria-pressed`:

```js
const confirmed = date.key === state.confirmedBooking?.dateKey;
button.dataset.confirmed = String(confirmed);
button.setAttribute(
  "aria-label",
  `${date.weekday}${date.day}日${confirmed ? "，已有预约" : ""}`,
);
```

In `renderTimes()`, calculate whether the visible time is the user's confirmed booking, retain `disabled = unavailable`, and prioritize the confirmed label:

```js
const confirmed =
  state.confirmedBooking?.dateKey === state.selectedDateKey &&
  state.confirmedBooking.time === time;
button.dataset.confirmed = String(confirmed);
button.setAttribute(
  "aria-label",
  confirmed ? `${time}，已预约` : unavailable ? `${time}，不可预约` : `${time}，可预约`,
);
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: all trainer booking contract tests pass.

- [ ] **Step 5: Commit the rendering contract**

```bash
git add tests/trainer-booking-contract.test.js src/trainer-booking-view.js
git commit -m "feat: expose confirmed booking controls"
```

### Task 2: Style the confirmed date locator and booked time

**Files:**
- Modify: `tests/trainer-booking-contract.test.js`
- Modify: `src/trainer-booking.css`

- [ ] **Step 1: Write the failing visual contract test**

Add assertions for the approved date-number marker, full-yellow time state, fixed badge, and disabled-style override:

```js
test("uses a yellow date marker and checked time cell for the confirmed booking", () => {
  assert.match(css, /\.booking-date\[data-confirmed="true"\]:not\(\[aria-pressed="true"\]\) strong\s*{[^}]*color:\s*#16130b[^}]*background:\s*#f8d553/s);
  assert.match(css, /\.booking-time\[data-confirmed="true"\]:disabled\s*{[^}]*position:\s*relative[^}]*color:\s*#16130b[^}]*background:\s*#f8d553[^}]*opacity:\s*1/s);
  assert.match(css, /\.booking-time\[data-confirmed="true"\]::after\s*{[^}]*content:\s*"✓"[^}]*top:\s*4px[^}]*right:\s*4px[^}]*width:\s*14px[^}]*height:\s*14px[^}]*border-radius:\s*50%/s);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/trainer-booking-contract.test.js`

Expected: FAIL because no confirmed date/time selectors exist in the stylesheet.

- [ ] **Step 3: Add the confirmed visual states after generic disabled rules**

Append these rules after `.booking-time:disabled` so the user's booking wins the cascade:

```css
.booking-date[data-confirmed="true"]:not([aria-pressed="true"]) strong {
  color: #16130b;
  background: #f8d553;
  box-shadow: 0 0 12px rgba(248, 213, 83, 0.2);
}

.booking-time[data-confirmed="true"]:disabled {
  position: relative;
  padding-right: 20px;
  border-color: #f8d553;
  color: #16130b;
  background: #f8d553;
  box-shadow: 0 0 14px rgba(248, 213, 83, 0.16);
  -webkit-text-fill-color: #16130b;
  opacity: 1;
  cursor: default;
}

.booking-time[data-confirmed="true"]::after {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  width: 14px;
  height: 14px;
  place-items: center;
  border: 1px solid rgba(22, 19, 11, 0.26);
  border-radius: 50%;
  content: "✓";
  color: #16130b;
  background: rgba(255, 255, 255, 0.34);
  font-size: 9px;
  line-height: 1;
}
```

- [ ] **Step 4: Run the focused test and the complete suite**

Run: `node --test tests/trainer-booking-contract.test.js && npm test`

Expected: focused contract and all tests pass with zero failures.

- [ ] **Step 5: Commit the visual state**

```bash
git add tests/trainer-booking-contract.test.js src/trainer-booking.css
git commit -m "style: distinguish confirmed trainer booking"
```

### Task 3: Verify the complete interaction in a browser

**Files:**
- Verify: `src/trainer-booking-view.js`
- Verify: `src/trainer-booking.css`

- [ ] **Step 1: Start the application on a free local port**

Run: `python3 -m http.server 4182 --bind 127.0.0.1`

Expected: server listens at `http://127.0.0.1:4182/`.

- [ ] **Step 2: Confirm a booking at `402x874`**

Use Playwright CLI to open the trainer page, choose an available time, confirm it, and verify:

- the booked time is fully yellow with a circular check at its upper-right;
- the booked time remains disabled but is not grey;
- the existing status row displays the confirmed appointment;
- no controls overlap or change grid dimensions.

- [ ] **Step 3: Switch to another date and back**

Verify that the original confirmed date shows only a yellow `28px` date-number circle while another date is active. Return to the booked date and verify the full-yellow checked time reappears.

- [ ] **Step 4: Check accessibility and console output**

Verify the confirmed time exposes an `已预约` accessible label, the active date still uses `aria-pressed`, and the browser console has zero errors.

- [ ] **Step 5: Run final verification**

Run: `npm test && git diff --check && git status --short`

Expected: all tests pass, diff check is clean, and only intended implementation files plus this plan are changed.
