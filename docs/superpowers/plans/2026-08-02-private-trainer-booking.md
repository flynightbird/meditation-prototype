# Private Trainer Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved black-and-yellow private-trainer booking page to the existing mobile prototype and connect it to the current six-tab navigation.

**Architecture:** Leave the meditation state machine untouched. Put date/availability transitions in a pure module, page rendering and dialog behavior in a dedicated controller, and all page visuals in a dedicated stylesheet; `src/app.js` only routes navigation. The existing Dock is replaced in-place by a contextual action bar while a time is selected, then restored after cancellation or booking success.

**Tech Stack:** Vanilla HTML, CSS, JavaScript ES modules, native `<dialog>`, Node.js built-in test runner, browser screenshot verification.

---

## File Map

- Create `assets/trainer-hero.png`, `assets/trainer-map.png`, and `assets/trainer-avatar.png` from the supplied Figma Make archive.
- Create `src/trainer-booking.js` for pure dates, availability, and booking transitions.
- Create `src/trainer-booking-view.js` for DOM rendering, selection, the action bar, and confirmation sheet.
- Create `src/trainer-booking.css` for the page-specific black/yellow interface.
- Create `tests/trainer-booking.test.js` and `tests/trainer-booking-contract.test.js`.
- Modify `index.html` to add the page, contextual action bar, and confirmation dialog.
- Modify `src/app.js` only to mount the controller and route `coach`/`trainer` tabs.
- Preserve `src/state-machine.js`, `src/experience.js`, `src/media-scene.js`, all homepage media, and the user's current uncommitted homepage changes.

### Task 1: Add Assets and the Pure Booking Model

**Files:**
- Create: `assets/trainer-hero.png`
- Create: `assets/trainer-map.png`
- Create: `assets/trainer-avatar.png`
- Create: `src/trainer-booking.js`
- Test: `tests/trainer-booking.test.js`

- [ ] **Step 1: Extract and copy the supplied images**

Run:

```bash
trainer_tmp="$(mktemp -d)"
unzip -q "/Users/admin/Downloads/Futuristic fitness app design.zip" -d "$trainer_tmp"
cp "$trainer_tmp/src/imports/Frame14/191e5ee0a53d6a1dbb548bc007d291cc6d13c2ce.png" assets/trainer-hero.png
cp "$trainer_tmp/src/imports/Frame14/0c7b20b78206722ba5b142805fa23be459fa1309.png" assets/trainer-map.png
cp "$trainer_tmp/src/imports/Frame14/b445e9c5e0a9eb351ec4dd1f62f38edb237c7a92.png" assets/trainer-avatar.png
file assets/trainer-hero.png assets/trainer-map.png assets/trainer-avatar.png
```

Expected: three valid PNGs, approximately `1138x1502`, `2496x1664`, and `469x532`.

- [ ] **Step 2: Write the failing model tests**

Create `tests/trainer-booking.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOKING_TIMES,
  createBookingDates,
  createInitialBookingState,
  isTimeUnavailable,
  transitionBooking,
} from "../src/trainer-booking.js";

const today = new Date(2026, 7, 2, 12);

test("builds only the next seven local calendar days", () => {
  const dates = createBookingDates(today);
  assert.equal(dates.length, 7);
  assert.equal(dates[0].key, "2026-08-02");
  assert.equal(dates[6].key, "2026-08-08");
  assert.equal(dates[0].isToday, true);
});

test("selects today but no default time", () => {
  const state = createInitialBookingState(today);
  assert.equal(state.selectedDateKey, "2026-08-02");
  assert.equal(state.selectedTime, null);
  assert.equal(state.confirmedBooking, null);
});

test("rejects occupied times and accepts available times", () => {
  let state = createInitialBookingState(today);
  state = transitionBooking(state, { type: "SELECT_TIME", time: "10:30" });
  assert.equal(state.selectedTime, null);
  state = transitionBooking(state, { type: "SELECT_TIME", time: "11:00" });
  assert.equal(state.selectedTime, "11:00");
});

test("date changes and cancel clear pending selection", () => {
  let state = createInitialBookingState(today);
  state = transitionBooking(state, { type: "SELECT_TIME", time: "11:00" });
  state = transitionBooking(state, { type: "SELECT_DATE", dateKey: "2026-08-04" });
  assert.equal(state.selectedTime, null);
  state = transitionBooking(state, { type: "SELECT_TIME", time: "13:00" });
  state = transitionBooking(state, { type: "CANCEL_SELECTION" });
  assert.equal(state.selectedTime, null);
});

test("confirmation persists the appointment and disables its slot", () => {
  let state = createInitialBookingState(today);
  state = transitionBooking(state, { type: "SELECT_TIME", time: "11:00" });
  state = transitionBooking(state, { type: "CONFIRM_BOOKING" });
  assert.deepEqual(state.confirmedBooking, {
    dateKey: "2026-08-02",
    time: "11:00",
    coach: "李教练",
    store: "中田健身 · 南山旗舰店",
  });
  assert.equal(state.selectedTime, null);
  assert.equal(isTimeUnavailable(state, "11:00"), true);
});

test("uses the approved demonstration slots", () => {
  assert.deepEqual(BOOKING_TIMES, [
    "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30",
  ]);
});
```

- [ ] **Step 3: Run the test and confirm the expected failure**

Run `node --test tests/trainer-booking.test.js`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/trainer-booking.js`.

- [ ] **Step 4: Implement the pure model**

Create `src/trainer-booking.js`:

```js
export const BOOKING_TIMES = [
  "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30",
];

const DEFAULT_UNAVAILABLE = new Set(["10:30", "14:00"]);

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createBookingDates(today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: dateKey(date),
      day: date.getDate(),
      weekday: index === 0 ? "今天" : new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date),
      isToday: index === 0,
    };
  });
}

export function createInitialBookingState(today = new Date()) {
  const dates = createBookingDates(today);
  return { dates, selectedDateKey: dates[0].key, selectedTime: null, confirmedBooking: null };
}

export function isTimeUnavailable(state, time) {
  return DEFAULT_UNAVAILABLE.has(time) ||
    (state.confirmedBooking?.dateKey === state.selectedDateKey && state.confirmedBooking.time === time);
}

export function transitionBooking(state, event) {
  if (event.type === "SELECT_DATE") {
    if (!state.dates.some(({ key }) => key === event.dateKey)) return state;
    return { ...state, selectedDateKey: event.dateKey, selectedTime: null };
  }
  if (event.type === "SELECT_TIME") {
    if (!BOOKING_TIMES.includes(event.time) || isTimeUnavailable(state, event.time)) return state;
    return { ...state, selectedTime: event.time };
  }
  if (event.type === "CANCEL_SELECTION") return { ...state, selectedTime: null };
  if (event.type === "CONFIRM_BOOKING" && state.selectedTime) {
    return {
      ...state,
      confirmedBooking: {
        dateKey: state.selectedDateKey,
        time: state.selectedTime,
        coach: "李教练",
        store: "中田健身 · 南山旗舰店",
      },
      selectedTime: null,
    };
  }
  return state;
}
```

- [ ] **Step 5: Run the model tests**

Run `node --test tests/trainer-booking.test.js`.

Expected: 6 tests PASS.

- [ ] **Step 6: Commit the model and assets**

```bash
git add assets/trainer-hero.png assets/trainer-map.png assets/trainer-avatar.png src/trainer-booking.js tests/trainer-booking.test.js
git commit -m "feat: add trainer booking model and assets"
```

### Task 2: Add Semantic Page Markup and Contracts

**Files:**
- Modify: `index.html`
- Create: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Write failing structural contracts**

Create `tests/trainer-booking-contract.test.js`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("provides the complete trainer booking surface", () => {
  for (const id of ["trainerPage", "bookingDates", "bookingTimes", "bookingActionBar", "bookingDialog"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("keeps the map and all three nearby stores", () => {
  assert.match(html, /assets\/trainer-map\.png/);
  for (const store of ["南浦大桥店", "前海湾旗舰店", "海上世界店"]) {
    assert.match(html, new RegExp(store));
  }
});

test("places persistent status before the date cards", () => {
  assert.match(html, /id="bookingStatus"[\s\S]*id="bookingDates"/);
});

test("uses cancel then confirm and omits payment copy", () => {
  assert.match(html, /data-action="cancel-booking-selection"[\s\S]*data-action="open-booking-dialog"/);
  assert.doesNotMatch(html, /扣除 1 课时|剩余\s*\d+\s*节/);
});

test("omits redundant schedule labels", () => {
  assert.doesNotMatch(html, />可约时间</);
  assert.doesNotMatch(html, />已选择/);
});
```

- [ ] **Step 2: Run the contract and confirm failure**

Run `node --test tests/trainer-booking-contract.test.js`.

Expected: FAIL because `#trainerPage` and the booking elements do not exist.

- [ ] **Step 3: Load the page-specific stylesheet**

Add after the current stylesheet in `index.html`:

```html
<link rel="stylesheet" href="./src/trainer-booking.css" />
```

- [ ] **Step 4: Add the trainer page before the existing toast**

Insert this inside `#app`, immediately before `.toast`:

```html
<section class="trainer-page" id="trainerPage" aria-label="预约私教" hidden>
  <div class="trainer-scroll" id="trainerScroll">
    <header class="trainer-hero">
      <img src="./assets/trainer-hero.png" alt="李教练" />
      <div class="trainer-hero-shade" aria-hidden="true"></div>
      <p class="trainer-store"><span aria-hidden="true"></span>中田健身 · 南山旗舰店</p>
      <div class="trainer-identity">
        <small>我的教练</small>
        <h1>李教练</h1>
        <p>已陪伴训练 16 次</p>
      </div>
      <div class="trainer-hero-cut" aria-hidden="true"></div>
    </header>

    <div class="trainer-content">
      <section class="booking-panel" aria-labelledby="bookingTitle">
        <header class="booking-heading">
          <h2 id="bookingTitle">选择预约时间</h2><span>未来 7 天</span>
        </header>
        <p class="booking-status" id="bookingStatus" role="status" hidden></p>
        <div class="booking-dates" id="bookingDates" aria-label="选择日期"></div>
        <div class="booking-times" id="bookingTimes" aria-label="选择时间"></div>
      </section>

      <section class="nearby-panel" aria-labelledby="nearbyTitle">
        <header class="nearby-heading"><h2 id="nearbyTitle">附近门店</h2><span>共 3 家</span></header>
        <div class="trainer-map">
          <img src="./assets/trainer-map.png" alt="深圳南山区附近门店地图" />
          <span class="map-pin pin-one">1</span>
          <span class="map-pin pin-two">2</span>
          <span class="map-pin pin-three is-closed">3</span>
        </div>
        <div class="store-list">
          <article class="store-row"><b>1</b><div><h3>南浦大桥店 <em>营业中</em></h3><p>756m · 南浦一路111号一层</p><small>10:00–24:00 · 私教体验 · 体态检测</small></div><span aria-hidden="true">›</span></article>
          <article class="store-row"><b>2</b><div><h3>前海湾旗舰店 <em>营业中</em></h3><p>2.8km · 前海路99号B1层</p><small>09:00–22:00 · 私教体验 · 停车方便</small></div><span aria-hidden="true">›</span></article>
          <article class="store-row is-closed"><b>3</b><div><h3>海上世界店 <em>已打烊</em></h3><p>4.1km · 望海路1187号商业中心</p><small>10:00–21:30 · 体态检测 · 停车方便</small></div><span aria-hidden="true">›</span></article>
        </div>
      </section>
    </div>
  </div>
</section>

<section class="booking-action-bar" id="bookingActionBar" aria-hidden="true">
  <p><strong id="bookingActionTime"></strong><span>李教练 · 60分钟</span></p>
  <div>
    <button class="booking-cancel-action" type="button" data-action="cancel-booking-selection">取消</button>
    <button class="booking-confirm-action" type="button" data-action="open-booking-dialog">确认预约</button>
  </div>
</section>

<dialog class="booking-dialog" id="bookingDialog">
  <form method="dialog" class="booking-sheet">
    <span class="booking-sheet-handle" aria-hidden="true"></span>
    <header><div><small>预约确认</small><h2>李教练私教课</h2></div><img src="./assets/trainer-avatar.png" alt="李教练" /></header>
    <dl>
      <div><dt>课程</dt><dd>减脂塑形 · 60分钟</dd></div>
      <div><dt>时间</dt><dd id="bookingDialogTime"></dd></div>
      <div><dt>地点</dt><dd>中田健身 · 南山旗舰店</dd></div>
    </dl>
    <button class="booking-sheet-confirm" id="bookingSheetConfirm" type="button">确认预约</button>
    <button class="booking-sheet-cancel" value="cancel">取消</button>
  </form>
</dialog>
```

- [ ] **Step 5: Run the structural contracts**

Run `node --test tests/trainer-booking-contract.test.js`.

Expected: all five structural tests PASS.

- [ ] **Step 6: Commit the structure**

```bash
git add index.html tests/trainer-booking-contract.test.js
git commit -m "feat: add trainer booking page structure"
```

### Task 3: Style the Black-and-Yellow Booking Page

**Files:**
- Create: `src/trainer-booking.css`
- Modify: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Add failing visual contracts**

Extend the test file by reading the CSS and adding:

```js
const css = readFileSync(new URL("../src/trainer-booking.css", import.meta.url), "utf8");

test("preserves the dark Hero and glass panel framework", () => {
  assert.match(css, /\.trainer-page\s*{[^}]*background:\s*#0b0e14/s);
  assert.match(css, /\.trainer-hero\s*{[^}]*height:\s*320px/s);
  assert.match(css, /\.booking-panel[\s\S]*backdrop-filter:\s*blur\(24px\)/s);
});

test("uses one full-width 70px bottom context and approved button size", () => {
  assert.match(css, /\.booking-action-bar\s*{[^}]*right:\s*0[^}]*bottom:\s*0[^}]*left:\s*0[^}]*height:\s*70px/s);
  assert.match(css, /\.booking-cancel-action,\s*\.booking-confirm-action\s*{[^}]*height:\s*46px/s);
  assert.match(css, /\.booking-confirm-action\s*{[^}]*padding:\s*0 24px/s);
});

test("keeps success status in normal layout flow", () => {
  assert.match(css, /\.booking-status\s*{[^}]*position:\s*relative/s);
  assert.doesNotMatch(css, /\.booking-status\s*{[^}]*position:\s*absolute/s);
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run `node --test tests/trainer-booking-contract.test.js`.

Expected: FAIL because `src/trainer-booking.css` does not exist.

- [ ] **Step 3: Create the page positioning, Hero, and panels**

Create `src/trainer-booking.css` with:

```css
.trainer-page {
  position: absolute;
  z-index: 15;
  inset: 0 0 70px;
  overflow: hidden;
  color: #fff;
  background: #0b0e14;
}
.trainer-page[hidden] { display: none; }
.trainer-scroll { height: 100%; overflow: auto; overscroll-behavior: contain; scrollbar-width: none; }
.trainer-scroll::-webkit-scrollbar { display: none; }
.trainer-hero { position: relative; height: 320px; overflow: hidden; }
.trainer-hero > img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }
.trainer-hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,14,20,.48), rgba(11,14,20,.08) 38%, #0b0e14 100%), linear-gradient(90deg, rgba(11,14,20,.52), transparent 62%); }
.trainer-store, .trainer-identity { position: absolute; z-index: 1; right: 22px; left: 22px; }
.trainer-store { top: 54px; display: flex; gap: 7px; align-items: center; margin: 0; color: rgba(248,213,83,.78); font-size: 11px; }
.trainer-store span { width: 5px; height: 5px; border-radius: 50%; background: #f8d553; box-shadow: 0 0 8px rgba(248,213,83,.7); }
.trainer-identity { bottom: 40px; }
.trainer-identity small { display: inline-flex; padding: 5px 9px; border: 1px solid rgba(248,213,83,.28); border-radius: 999px; color: #f8d553; background: rgba(248,213,83,.1); font-size: 9px; }
.trainer-identity h1 { margin: 12px 0 6px; font-family: var(--display); font-size: 34px; font-weight: 400; line-height: 1; }
.trainer-identity p { margin: 0; color: rgba(255,255,255,.58); font-size: 12px; }
.trainer-hero-cut { position: absolute; right: 0; bottom: -1px; left: 0; height: 38px; background: #0b0e14; clip-path: polygon(0 72%, 100% 10%, 100% 100%, 0 100%); }
.trainer-content { display: grid; gap: 14px; padding: 0 14px 24px; }
.booking-panel, .nearby-panel { position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,.09); border-radius: 24px; background: rgba(255,255,255,.045); box-shadow: inset 0 1px rgba(255,255,255,.06), 0 18px 42px rgba(0,0,0,.34); backdrop-filter: blur(24px) saturate(1.5); }
.booking-panel { padding: 18px 18px 20px; }
.booking-heading, .nearby-heading { display: flex; align-items: baseline; justify-content: space-between; }
.booking-heading h2, .nearby-heading h2 { margin: 0; font-family: var(--display); font-size: 16px; font-weight: 400; }
.booking-heading span, .nearby-heading span { color: rgba(255,255,255,.34); font-size: 10px; }
.booking-status { position: relative; margin: 14px 0 0; padding: 12px 0; border-block: 1px solid rgba(248,213,83,.14); color: rgba(248,213,83,.9); font-size: 12px; }
.booking-status[hidden] { display: none; }
```

- [ ] **Step 4: Add date, time, map, and store styles**

Append:

```css
.booking-dates { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: 14px; }
.booking-date, .booking-time { border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.62); background: rgba(255,255,255,.035); }
.booking-date { display: grid; min-width: 0; height: 58px; padding: 8px 0; place-items: center; border-radius: 13px; font-size: 9px; }
.booking-date strong { font-size: 15px; font-weight: 400; }
.booking-date[aria-pressed="true"], .booking-time[aria-pressed="true"] { border-color: rgba(248,213,83,.52); color: #f8d553; background: rgba(248,213,83,.13); box-shadow: 0 0 13px rgba(248,213,83,.12); }
.booking-times { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.booking-time { height: 40px; border-radius: 10px; font-size: 12px; }
.booking-time:disabled { color: rgba(255,255,255,.18); background: rgba(255,255,255,.018); cursor: not-allowed; }
.nearby-heading { padding: 18px 18px 14px; }
.trainer-map { position: relative; height: 146px; margin: 0 14px 8px; overflow: hidden; border-radius: 16px; background: #0d1420; }
.trainer-map > img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.42) brightness(.62); opacity: .66; }
.map-pin { position: absolute; display: grid; width: 24px; height: 24px; place-items: center; border-radius: 50%; color: #0b0e14; background: #f8d553; box-shadow: 0 0 12px rgba(248,213,83,.45); font-size: 10px; }
.pin-one { top: 54%; left: 51%; } .pin-two { top: 26%; left: 22%; } .pin-three { top: 20%; left: 73%; }
.map-pin.is-closed { color: rgba(255,255,255,.5); background: rgba(255,255,255,.14); box-shadow: none; }
.store-list { padding: 0 16px 8px; }
.store-row { display: grid; grid-template-columns: 28px 1fr 14px; gap: 11px; align-items: center; min-height: 82px; border-top: 1px solid rgba(255,255,255,.06); }
.store-row > b { display: grid; width: 26px; height: 26px; place-items: center; border: 1px solid rgba(248,213,83,.3); border-radius: 50%; color: #f8d553; background: rgba(248,213,83,.1); font-size: 10px; }
.store-row h3 { margin: 0 0 4px; font-size: 13px; font-weight: 400; }
.store-row h3 em { padding: 2px 5px; border-radius: 5px; color: #f8d553; background: rgba(248,213,83,.1); font-size: 8px; font-style: normal; }
.store-row p { margin: 0; color: rgba(255,255,255,.46); font-size: 11px; }
.store-row small { display: block; margin-top: 5px; color: rgba(255,255,255,.3); font-size: 9px; }
.store-row > span { color: rgba(255,255,255,.28); font-size: 20px; }
.store-row.is-closed { opacity: .56; }
```

- [ ] **Step 5: Add the action bar, bottom sheet, and responsive behavior**

Append:

```css
.booking-action-bar { position: absolute; z-index: 30; right: 0; bottom: 0; left: 0; display: grid; height: 70px; grid-template-columns: minmax(0,1fr) auto; gap: 10px; align-items: center; padding: 8px 12px; border-top: 1px solid rgba(255,255,255,.1); background: rgba(11,14,20,.96); backdrop-filter: blur(20px); opacity: 0; pointer-events: none; transform: translateY(10px); transition: opacity 180ms ease, transform 260ms var(--ease-out); }
.booking-action-bar.is-visible { opacity: 1; pointer-events: auto; transform: none; }
.booking-action-bar > p { min-width: 0; margin: 0; }
.booking-action-bar > p strong, .booking-action-bar > p span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.booking-action-bar > p strong { font-size: 12px; font-weight: 400; }
.booking-action-bar > p span { margin-top: 3px; color: rgba(255,255,255,.4); font-size: 9px; }
.booking-action-bar > div { display: flex; align-items: center; gap: 6px; }
.booking-cancel-action, .booking-confirm-action { height: 46px; border-radius: 14px; font-size: 12px; font-weight: 400; }
.booking-cancel-action { padding: 0 10px; border: 0; color: rgba(255,255,255,.6); background: transparent; }
.booking-confirm-action { padding: 0 24px; border: 1px solid rgba(255,255,255,.25); color: #0b0e14; background: linear-gradient(135deg,#f8d553,#e8ff66); }
.booking-dialog { width: min(100%,430px); max-width: none; margin: auto auto 0; padding: 0; border: 0; border-radius: 30px 30px 0 0; color: #fff; background: linear-gradient(170deg,#1e2430,#0e121a); box-shadow: 0 -20px 80px rgba(0,0,0,.7); }
.booking-dialog[open] { animation: booking-sheet-in 320ms var(--ease-out) both; }
.booking-dialog::backdrop { background: rgba(8,11,16,.72); backdrop-filter: blur(2px); }
.booking-dialog[open]::backdrop { animation: booking-backdrop-in 220ms ease both; }
.booking-sheet { padding: 14px 24px 28px; }
.booking-sheet-handle { display: block; width: 40px; height: 4px; margin: 0 auto 18px; border-radius: 99px; background: rgba(255,255,255,.16); }
.booking-sheet header { display: flex; align-items: center; justify-content: space-between; }
.booking-sheet h2 { margin: 4px 0 0; font-family: var(--display); font-size: 22px; font-weight: 400; }
.booking-sheet header img { width: 48px; height: 48px; border-radius: 14px; object-fit: cover; }
.booking-sheet dl { margin: 18px 0; padding: 14px 16px; border: 1px solid rgba(248,213,83,.12); border-radius: 16px; background: rgba(248,213,83,.05); }
.booking-sheet dl div { display: flex; min-height: 34px; align-items: center; justify-content: space-between; gap: 18px; }
.booking-sheet dt { color: rgba(255,255,255,.4); font-size: 12px; }
.booking-sheet dd { margin: 0; text-align: right; font-size: 12px; }
.booking-sheet-confirm, .booking-sheet-cancel { width: 100%; height: 46px; border-radius: 14px; font-weight: 400; }
.booking-sheet-confirm { padding: 0 24px; border: 1px solid rgba(255,255,255,.25); color: #0b0e14; background: linear-gradient(135deg,#f8d553,#e8ff66); }
.booking-sheet-confirm.is-success { background: linear-gradient(135deg,#8fe98f,#f8d553); }
.booking-sheet-cancel { margin-top: 8px; border: 1px solid rgba(255,255,255,.07); color: rgba(255,255,255,.54); background: rgba(255,255,255,.04); }
.is-trainer-view .room, .is-trainer-view .scene-video, .is-trainer-view .media-transition, .is-trainer-view .atmosphere, .is-trainer-view .app-header, .is-trainer-view .message, .is-trainer-view .timer-panel, .is-trainer-view .reward-layer, .is-trainer-view .action-zone, .is-trainer-view .task-rail { visibility: hidden; }
.is-booking-action .bottom-nav { opacity: 0; pointer-events: none; transform: translateY(10px); }
@keyframes booking-sheet-in { from { opacity: 0; transform: translateY(36px); } }
@keyframes booking-backdrop-in { from { opacity: 0; } }
@media (max-width: 374px) { .trainer-content { padding-inline: 10px; } .booking-panel { padding-inline: 14px; } .booking-dates { gap: 4px; } .booking-action-bar { gap: 6px; padding-inline: 8px; } .booking-confirm-action { padding-inline: 24px; } }
@media (prefers-reduced-motion: reduce) { .booking-action-bar, .bottom-nav, .booking-dialog { animation: none !important; transition-duration: 1ms !important; } }
```

- [ ] **Step 6: Run the contract suite**

Run `node --test tests/trainer-booking-contract.test.js`.

Expected: all structural and visual contracts PASS.

- [ ] **Step 7: Commit the page styling**

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "feat: style trainer booking page"
```

### Task 4: Implement Rendering, Selection, Dialog, and Navigation

**Files:**
- Create: `src/trainer-booking-view.js`
- Modify: `src/app.js`
- Modify: `tests/trainer-booking-contract.test.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing integration contracts**

Append to `tests/trainer-booking-contract.test.js`:

```js
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/trainer-booking-view.js", import.meta.url), "utf8");

test("renders accessible copy-free unavailable slots", () => {
  assert.match(view, /BOOKING_TIMES\.map/);
  assert.match(view, /button\.disabled = unavailable/);
  assert.match(view, /button\.textContent = time/);
  assert.match(view, /aria-pressed/);
  assert.doesNotMatch(view, /textContent\s*=\s*["'`]已约/);
});

test("restores tabs and persists the success row", () => {
  assert.match(view, /bookingStatus\.hidden = !confirmed/);
  assert.match(view, /app\.classList\.toggle\("is-booking-action"/);
  assert.match(view, /setTimeout[\s\S]*1200/s);
  assert.match(view, /bookingDialog\.close\(\)/);
});

test("routes the trainer tab without changing stores", () => {
  assert.match(app, /mountTrainerBooking/);
  assert.match(app, /nav === "trainer"/);
  assert.doesNotMatch(view, /SELECT_STORE|selectedStore|store-detail/);
});
```

- [ ] **Step 2: Run the contracts and confirm failure**

Run `node --test tests/trainer-booking-contract.test.js`.

Expected: FAIL because `src/trainer-booking-view.js` does not exist and `app.js` has no trainer route.

- [ ] **Step 3: Implement the focused DOM controller**

Create `src/trainer-booking-view.js`:

```js
import { BOOKING_TIMES, createInitialBookingState, isTimeUnavailable, transitionBooking } from "./trainer-booking.js";

function dateLabel(dates, dateKey) {
  const date = dates.find(({ key }) => key === dateKey);
  return date ? `${date.weekday} ${date.day}日` : dateKey;
}

export function mountTrainerBooking({ app, bottomNav, sceneVideo }) {
  const trainerPage = document.querySelector("#trainerPage");
  const trainerScroll = document.querySelector("#trainerScroll");
  const bookingDates = document.querySelector("#bookingDates");
  const bookingTimes = document.querySelector("#bookingTimes");
  const bookingStatus = document.querySelector("#bookingStatus");
  const actionBar = document.querySelector("#bookingActionBar");
  const actionTime = document.querySelector("#bookingActionTime");
  const dialog = document.querySelector("#bookingDialog");
  const dialogTime = document.querySelector("#bookingDialogTime");
  const sheetConfirm = document.querySelector("#bookingSheetConfirm");
  let state = createInitialBookingState();
  let visible = false;
  let successTimer = null;

  function renderDates() {
    bookingDates.replaceChildren(...state.dates.map((date) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-date";
      button.dataset.action = "select-booking-date";
      button.dataset.dateKey = date.key;
      button.setAttribute("aria-pressed", String(date.key === state.selectedDateKey));
      button.innerHTML = `<span>${date.weekday}</span><strong>${date.day}</strong>`;
      return button;
    }));
  }

  function renderTimes() {
    bookingTimes.replaceChildren(...BOOKING_TIMES.map((time) => {
      const unavailable = isTimeUnavailable(state, time);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-time";
      button.dataset.action = "select-booking-time";
      button.dataset.time = time;
      button.disabled = unavailable;
      button.textContent = time;
      button.setAttribute("aria-pressed", String(state.selectedTime === time));
      button.setAttribute("aria-label", unavailable ? `${time}，不可预约` : `${time}，可预约`);
      return button;
    }));
  }

  function renderStatus() {
    const confirmed = state.confirmedBooking;
    bookingStatus.hidden = !confirmed;
    bookingStatus.textContent = confirmed
      ? `✓ 已预约 · ${dateLabel(state.dates, confirmed.dateKey)} ${confirmed.time} · ${confirmed.coach}`
      : "";
  }

  function renderActionBar() {
    const selected = visible && Boolean(state.selectedTime);
    app.classList.toggle("is-booking-action", selected);
    actionBar.classList.toggle("is-visible", selected);
    actionBar.setAttribute("aria-hidden", String(!selected));
    bottomNav.setAttribute("aria-hidden", String(selected));
    actionTime.textContent = selected ? `${dateLabel(state.dates, state.selectedDateKey)} ${state.selectedTime}` : "";
  }

  function render() { renderDates(); renderTimes(); renderStatus(); renderActionBar(); }

  function show() {
    visible = true;
    trainerPage.hidden = false;
    app.classList.add("is-trainer-view");
    sceneVideo.pause();
    trainerScroll.scrollTop = 0;
    render();
  }

  function hide() {
    visible = false;
    trainerPage.hidden = true;
    app.classList.remove("is-trainer-view", "is-booking-action");
    actionBar.classList.remove("is-visible");
    actionBar.setAttribute("aria-hidden", "true");
    bottomNav.setAttribute("aria-hidden", "false");
  }

  function openDialog() {
    if (!state.selectedTime) return;
    dialogTime.textContent = `${dateLabel(state.dates, state.selectedDateKey)} ${state.selectedTime}`;
    sheetConfirm.textContent = "确认预约";
    sheetConfirm.classList.remove("is-success");
    dialog.showModal();
  }

  trainerPage.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "select-booking-date") state = transitionBooking(state, { type: "SELECT_DATE", dateKey: button.dataset.dateKey });
    if (button.dataset.action === "select-booking-time") state = transitionBooking(state, { type: "SELECT_TIME", time: button.dataset.time });
    render();
  });

  actionBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "cancel-booking-selection") {
      state = transitionBooking(state, { type: "CANCEL_SELECTION" });
      render();
    }
    if (button.dataset.action === "open-booking-dialog") openDialog();
  });

  sheetConfirm.addEventListener("click", () => {
    state = transitionBooking(state, { type: "CONFIRM_BOOKING" });
    sheetConfirm.textContent = "✓ 预约成功";
    sheetConfirm.classList.add("is-success");
    window.clearTimeout(successTimer);
    successTimer = window.setTimeout(() => { dialog.close(); render(); }, 1200);
  });

  render();
  return { show, hide };
}
```

- [ ] **Step 4: Mount the controller and route the tabs**

At the top of `src/app.js` add:

```js
import { mountTrainerBooking } from "./trainer-booking-view.js";
```

After current DOM queries add:

```js
const trainerBooking = mountTrainerBooking({ app, bottomNav, sceneVideo });
```

Before the app click listener add:

```js
function setActiveNavigation(nav) {
  bottomNav.querySelectorAll(".nav-item").forEach((item) => {
    const active = item.dataset.nav === nav;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}
```

Replace the existing one-line `nav-tap` branch with:

```js
if (action === "nav-tap") {
  const nav = button.dataset.nav;
  if (nav === "trainer") {
    finishWelcome();
    trainerBooking.show();
    setActiveNavigation("trainer");
  } else if (nav === "coach") {
    trainerBooking.hide();
    setActiveNavigation("coach");
    playCurrentScene({ fromScreen: state.screen });
  } else {
    showToast("敬请期待");
  }
}
```

- [ ] **Step 5: Update the existing navigation contract precisely**

In `tests/visual-contract.test.js`, replace only the old `button.dataset.nav !== "coach"` assertion with:

```js
assert.match(app, /nav === "trainer"[\s\S]*trainerBooking\.show\(\)/);
assert.match(app, /nav === "coach"[\s\S]*trainerBooking\.hide\(\)/);
assert.match(app, /else \{\s*showToast\("敬请期待"\)/);
```

- [ ] **Step 6: Run all tests**

Run `npm test`.

Expected: all existing meditation tests and all new booking tests PASS.

- [ ] **Step 7: Commit interaction integration**

```bash
git add src/trainer-booking-view.js src/app.js tests/trainer-booking-contract.test.js tests/visual-contract.test.js
git commit -m "feat: add trainer booking interaction"
```

### Task 5: Browser Verification and Responsive Polish

**Files:**
- Modify only if verification finds defects: `index.html`, `src/trainer-booking.css`, `src/trainer-booking-view.js`
- Test: `tests/trainer-booking-contract.test.js`, `tests/visual-contract.test.js`

- [ ] **Step 1: Start an isolated preview server**

Run `python3 -m http.server 4175 --bind 127.0.0.1` and keep it running.

Expected URL: `http://127.0.0.1:4175/?v=trainer-booking`.

- [ ] **Step 2: Verify initial state at 402×874**

Use browser automation to open the URL, set viewport `402×874`, and click `预约私教`.

Expected: Hero, fixed store, coach name, and 16-session copy appear; exactly seven dates appear; today is selected; no time, AI recommendation, rating metrics, or Hero CTA appears; six tabs remain visible. Capture `output/playwright/trainer-booking-402x874-initial.png`.

- [ ] **Step 3: Verify selection and the action bar**

Click `11:00`.

Expected: yellow selected slot; the six tabs are replaced in the same 70px region by date/time summary, `取消`, then a 46px `确认预约`; no second fixed row appears. Click `取消` and verify the six tabs return and selection clears. Capture `output/playwright/trainer-booking-402x874-selected.png` before cancelling.

- [ ] **Step 4: Verify dialog and booked state**

Select `11:00`, open the sheet, and confirm.

Expected: sheet shows course, selected time, and `中田健身 · 南山旗舰店`; no cost or lesson balance appears; success lasts about 1.2s; tabs return; `✓ 已预约 · … · 李教练` appears above date cards in normal flow; the confirmed slot is gray/disabled with no visible `已约` copy. Capture `output/playwright/trainer-booking-402x874-booked.png`.

- [ ] **Step 5: Verify scrolling, map, stores, and compact viewport**

At `402×874` and `375×812`, scroll to the page bottom and repeat initial, selected, dialog, and booked checks.

Expected: map, three pins, and all three store rows remain visible; rows do not switch the booking store or navigate in the Demo; final row is reachable above the Dock; no clipping, horizontal scroll, overlap, or console errors. Capture `output/playwright/trainer-booking-375x812-booked.png`.

- [ ] **Step 6: Run final regression checks**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests PASS, `git diff --check` is silent, and only intended booking files plus the user's pre-existing unrelated changes are listed.

- [ ] **Step 7: Commit any verification fixes**

If verification changed code:

```bash
git add index.html src/app.js src/trainer-booking.js src/trainer-booking-view.js src/trainer-booking.css tests/trainer-booking.test.js tests/trainer-booking-contract.test.js tests/visual-contract.test.js assets/trainer-hero.png assets/trainer-map.png assets/trainer-avatar.png
git commit -m "fix: polish trainer booking responsive flow"
```

If no fixes were needed, do not create an empty commit.
