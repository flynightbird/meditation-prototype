import test from "node:test";
import assert from "node:assert/strict";

import {
  BOOKING_TIMES,
  createBookingDates,
  createInitialBookingState,
  isTimeUnavailable,
  transitionBooking,
} from "../src/trainer-booking.js";

const today = new Date(2026, 7, 2, 12);
const todayKey = "2026-08-02";
const tomorrowKey = "2026-08-03";

test("creates exactly seven local booking dates starting today", () => {
  const dates = createBookingDates(today);

  assert.equal(dates.length, 7);
  assert.deepEqual(
    dates.map((date) => date.key),
    [
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
    ],
  );
  assert.equal(dates[0].isToday, true);
  assert.equal(dates[0].weekday, "今天");
  assert.match(dates[1].weekday, /^(周|星期)/);
});

test("creates an initial state with today's date and no selection", () => {
  const state = createInitialBookingState(today);

  assert.deepEqual(state.dates, createBookingDates(today));
  assert.equal(state.selectedDateKey, todayKey);
  assert.equal(state.selectedTime, null);
  assert.equal(state.confirmedBooking, null);
});

test("only permits available times to be selected", () => {
  const state = createInitialBookingState(today);

  assert.equal(isTimeUnavailable(state, "10:30"), true);
  assert.equal(isTimeUnavailable(state, "14:00"), true);
  assert.strictEqual(transitionBooking(state, { type: "SELECT_TIME", time: "10:30" }), state);
  assert.equal(
    transitionBooking(state, { type: "SELECT_TIME", time: "11:00" }).selectedTime,
    "11:00",
  );
});

test("selecting a valid date clears a selected time", () => {
  const selected = transitionBooking(createInitialBookingState(today), {
    type: "SELECT_TIME",
    time: "11:00",
  });
  const changedDate = transitionBooking(selected, { type: "SELECT_DATE", dateKey: tomorrowKey });

  assert.equal(changedDate.selectedDateKey, tomorrowKey);
  assert.equal(changedDate.selectedTime, null);
});

test("cancelling a selection keeps the selected date", () => {
  const selected = transitionBooking(createInitialBookingState(today), {
    type: "SELECT_TIME",
    time: "11:00",
  });
  const cancelled = transitionBooking(selected, { type: "CANCEL_SELECTION" });

  assert.equal(cancelled.selectedDateKey, todayKey);
  assert.equal(cancelled.selectedTime, null);
});

test("confirming an available time stores the booking and blocks it for that date", () => {
  const selected = transitionBooking(createInitialBookingState(today), {
    type: "SELECT_TIME",
    time: "11:00",
  });
  const confirmed = transitionBooking(selected, { type: "CONFIRM_BOOKING" });

  assert.deepEqual(confirmed.confirmedBooking, {
    dateKey: todayKey,
    time: "11:00",
    coach: "李教练",
    store: "中田健身 · 南山旗舰店",
  });
  assert.equal(confirmed.selectedTime, null);
  assert.equal(isTimeUnavailable(confirmed, "11:00"), true);
});

test("ignores invalid booking events and confirmation without a selected time", () => {
  const state = createInitialBookingState(today);

  assert.strictEqual(transitionBooking(state, { type: "SELECT_DATE", dateKey: "2026-08-30" }), state);
  assert.strictEqual(transitionBooking(state, { type: "SELECT_TIME", time: "12:00" }), state);
  assert.strictEqual(transitionBooking(state, { type: "CONFIRM_BOOKING" }), state);
});

test("exports the appointment slots in display order", () => {
  assert.deepEqual(BOOKING_TIMES, [
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
  ]);
});
