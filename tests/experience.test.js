import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSchedule,
  canPlayAutomaticHaptic,
  getGreeting,
  getLocalDateKey,
  shouldPlayDailyWelcome,
} from "../src/experience.js";

test("uses a time-aware greeting", () => {
  assert.equal(getGreeting(8), "早上好");
  assert.equal(getGreeting(14), "下午好");
  assert.equal(getGreeting(21), "晚上好");
  assert.equal(getGreeting(2), "这么晚还没休息吗");
});

test("creates a stable local date key", () => {
  assert.equal(getLocalDateKey(new Date(2026, 6, 31, 14, 20)), "2026-07-31");
});

test("plays the welcome once per day unless motion is reduced", () => {
  assert.equal(
    shouldPlayDailyWelcome({
      lastSeenKey: "2026-07-30",
      currentKey: "2026-07-31",
      reducedMotion: false,
    }),
    true,
  );
  assert.equal(
    shouldPlayDailyWelcome({
      lastSeenKey: "2026-07-31",
      currentKey: "2026-07-31",
      reducedMotion: false,
    }),
    false,
  );
  assert.equal(
    shouldPlayDailyWelcome({
      lastSeenKey: null,
      currentKey: "2026-07-31",
      reducedMotion: true,
    }),
    false,
  );
});

test("allows automatic haptics only after prior user activation", () => {
  assert.equal(canPlayAutomaticHaptic(), false);
  assert.equal(canPlayAutomaticHaptic(null), false);
  assert.equal(canPlayAutomaticHaptic({ hasBeenActive: false }), false);
  assert.equal(canPlayAutomaticHaptic({ hasBeenActive: true }), true);
});

test("builds seven tasks with meditation as the initial current task", () => {
  const schedule = buildSchedule("recommendation");
  assert.equal(schedule.length, 7);
  assert.deepEqual(
    schedule.map(({ id, time, status }) => ({ id, time, status })),
    [
      { id: "water-am", time: "08:00", status: "done" },
      { id: "lunch", time: "12:00", status: "done" },
      { id: "meditation", time: "15:30", status: "current" },
      { id: "dinner", time: "17:30", status: "upcoming" },
      { id: "water-pm", time: "18:30", status: "upcoming" },
      { id: "fitness", time: "19:00", status: "upcoming" },
      { id: "stretch", time: "22:30", status: "upcoming" },
    ],
  );
});

test("maps every scheduled task to its approved growth reward", () => {
  assert.deepEqual(
    buildSchedule("recommendation").map(({ id, reward }) => ({ id, ...reward })),
    [
      { id: "water-am", attribute: "vitality", label: "活力", value: 10 },
      { id: "lunch", attribute: "stamina", label: "体力", value: 10 },
      { id: "meditation", attribute: "focus", label: "专注", value: 10 },
      { id: "dinner", attribute: "stamina", label: "体力", value: 10 },
      { id: "water-pm", attribute: "vitality", label: "活力", value: 10 },
      { id: "fitness", attribute: "vitality", label: "活力", value: 10 },
      { id: "stretch", attribute: "vitality", label: "活力", value: 10 },
    ],
  );
});

test("promotes dinner while the reward settles and through meal preparation", () => {
  const settledSchedule = buildSchedule("reward-settled");
  assert.equal(settledSchedule[2].status, "done");
  assert.equal(settledSchedule[3].id, "dinner");
  assert.equal(settledSchedule[3].status, "current");

  const schedule = buildSchedule("meal-prep");
  assert.equal(schedule[2].status, "done");
  assert.equal(schedule[3].id, "dinner");
  assert.equal(schedule[3].status, "current");
  assert.equal(schedule[5].time, "19:00");
});
