import test from "node:test";
import assert from "node:assert/strict";

import {
  GROWTH_STATE_VERSION,
  addTaskReward,
  collectBubble,
  createGrowthState,
  getDailyProgress,
  getVisibleBubbles,
  normalizeGrowthState,
} from "../src/growth.js";

const reward = (id, taskId, attribute, value, createdAt) => ({
  id,
  taskId,
  attribute,
  value,
  createdAt,
});

test("progress starts at baseline 3 and caps at 4 after two unique task rewards", () => {
  const start = createGrowthState("2026-08-03", { initialProgress: 3 });
  const once = addTaskReward(start, reward("r1", "task-1", "stamina", 2, 10));
  const twice = addTaskReward(once, reward("r2", "task-2", "focus", 1, 20));

  assert.equal(GROWTH_STATE_VERSION, 1);
  assert.equal(getDailyProgress(start), 3);
  assert.equal(getDailyProgress(once), 4);
  assert.equal(getDailyProgress(twice), 4);
  assert.deepEqual(twice.daily.completedTaskIds, ["task-1", "task-2"]);
});

test("a duplicate reward ID does not alter state", () => {
  const state = addTaskReward(
    createGrowthState("2026-08-03"),
    reward("r1", "task-1", "stamina", 2, 10),
  );

  assert.equal(
    addTaskReward(state, reward("r1", "task-2", "focus", 5, 20)),
    state,
  );
});

test("normalization keeps a valid same-day state and preserves permanent state on rollover", () => {
  const state = {
    version: 1,
    daily: { dateKey: "2026-08-03", initialProgress: 2, completedTaskIds: ["task-1"] },
    totals: { stamina: 4, focus: 5, vitality: 6 },
    pendingRewards: [reward("r1", "task-1", "stamina", 2, 10)],
    claimedRewardIds: ["old"],
  };

  assert.equal(normalizeGrowthState(state, "2026-08-03"), state);
  assert.deepEqual(normalizeGrowthState(state, "2026-08-04"), {
    ...state,
    daily: { dateKey: "2026-08-04", initialProgress: 0, completedTaskIds: [] },
  });
  assert.deepEqual(normalizeGrowthState(null, "2026-08-03").daily, {
    dateKey: "2026-08-03",
    initialProgress: 3,
    completedTaskIds: [],
  });
});

test("five rewards render four bubbles by merging the earliest matching attribute pair", () => {
  let state = createGrowthState("2026-08-03");
  for (const entry of [
    reward("r1", "t1", "stamina", 2, 10),
    reward("r2", "t2", "focus", 3, 20),
    reward("r3", "t3", "stamina", 5, 30),
    reward("r4", "t4", "vitality", 7, 40),
    reward("r5", "t5", "focus", 11, 50),
  ]) state = addTaskReward(state, entry);

  assert.deepEqual(getVisibleBubbles(state), [
    { key: "r1", rewardIds: ["r1", "r3"], attribute: "stamina", value: 7, createdAt: 10 },
    { key: "r2", rewardIds: ["r2"], attribute: "focus", value: 3, createdAt: 20 },
    { key: "r4", rewardIds: ["r4"], attribute: "vitality", value: 7, createdAt: 40 },
    { key: "r5", rewardIds: ["r5"], attribute: "focus", value: 11, createdAt: 50 },
  ]);
});

test("bubble grouping finds a duplicate pair even when the first reward has no match", () => {
  let state = createGrowthState("2026-08-03");
  for (const entry of [
    reward("r1", "t1", "vitality", 1, 10),
    reward("r2", "t2", "focus", 2, 20),
    reward("r3", "t3", "stamina", 3, 30),
    reward("r4", "t4", "focus", 4, 40),
    reward("r5", "t5", "stamina", 5, 50),
  ]) state = addTaskReward(state, entry);

  assert.deepEqual(getVisibleBubbles(state)[1], {
    key: "r2", rewardIds: ["r2", "r4"], attribute: "focus", value: 6, createdAt: 20,
  });
});

test("collecting a merged bubble adds its total once and removes all its pending rewards", () => {
  let state = createGrowthState("2026-08-03");
  for (const entry of [
    reward("r1", "t1", "focus", 2, 10), reward("r2", "t2", "focus", 3, 20),
    reward("r3", "t3", "stamina", 1, 30), reward("r4", "t4", "vitality", 1, 40),
    reward("r5", "t5", "stamina", 1, 50),
  ]) state = addTaskReward(state, entry);

  const collected = collectBubble(state, ["r1", "r2"]);
  assert.equal(collected.totals.focus, 5);
  assert.deepEqual(collected.pendingRewards.map(({ id }) => id), ["r3", "r4", "r5"]);
  assert.deepEqual(collected.claimedRewardIds, ["r1", "r2"]);
  assert.equal(collectBubble(collected, ["r1", "r2"]), collected);
});

test("operations do not mutate their input state", () => {
  const initial = createGrowthState("2026-08-03");
  const snapshot = structuredClone(initial);
  const added = addTaskReward(initial, reward("r1", "t1", "stamina", 2, 10));
  const addedSnapshot = structuredClone(added);

  collectBubble(added, ["r1"]);
  assert.deepEqual(initial, snapshot);
  assert.deepEqual(added, addedSnapshot);
});
