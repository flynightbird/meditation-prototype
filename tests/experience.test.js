import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSchedule,
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

test("builds six tasks with meditation as the current recommendation", () => {
  const schedule = buildSchedule("recommendation");
  assert.equal(schedule.length, 6);
  assert.deepEqual(
    schedule.map(({ status }) => status),
    ["done", "done", "current", "upcoming", "upcoming", "upcoming"],
  );
  assert.equal(schedule[2].label, "冥想");
});

test("promotes fitness after meditation is complete", () => {
  const schedule = buildSchedule("next-task");
  assert.equal(schedule.length, 6);
  assert.equal(schedule[2].status, "done");
  assert.equal(schedule[3].status, "current");
  assert.equal(schedule[3].label, "力量训练");
});
