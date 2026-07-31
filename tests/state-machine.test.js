import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialState,
  formatTime,
  transition,
} from "../src/state-machine.js";

test("starts with a twenty second meditation demo", () => {
  assert.deepEqual(createInitialState(), {
    screen: "recommendation",
    secondsRemaining: 20,
    isPaused: false,
    mood: null,
  });
});

test("moves from meditation into the one-shot completion video", () => {
  let state = transition(createInitialState(), { type: "START" });
  assert.equal(state.screen, "active");

  state = { ...state, secondsRemaining: 1 };
  assert.equal(transition(state, { type: "TICK" }).screen, "completion");
  assert.equal(transition(state, { type: "END" }).screen, "completion");
});

test("timer ticks only while active and unpaused", () => {
  const active = transition(createInitialState(), { type: "START" });
  assert.equal(transition(active, { type: "TICK" }).secondsRemaining, 19);

  const paused = transition(active, { type: "TOGGLE_PAUSE" });
  assert.equal(paused.isPaused, true);
  assert.equal(transition(paused, { type: "TICK" }).secondsRemaining, 20);
  assert.equal(transition(paused, { type: "TOGGLE_PAUSE" }).isPaused, false);
});

test("requires a manual reward claim before reflection", () => {
  const completion = { ...createInitialState(), screen: "completion", secondsRemaining: 0 };
  const reward = transition(completion, { type: "COMPLETION_VIDEO_ENDED" });
  assert.equal(reward.screen, "reward");
  assert.equal(transition(reward, { type: "TICK" }).screen, "reward");
  assert.equal(transition(reward, { type: "CLAIM_REWARD" }).screen, "reflection");
});

test("moves from feedback to meal preparation and demo meal time", () => {
  const reflection = { ...createInitialState(), screen: "reflection", secondsRemaining: 0 };
  const confirmed = transition(reflection, {
    type: "SELECT_MOOD",
    mood: "lighter",
  });
  assert.equal(confirmed.screen, "feedback-confirmed");
  assert.equal(confirmed.mood, "lighter");

  const prep = transition(confirmed, { type: "FEEDBACK_COMPLETE" });
  assert.equal(prep.screen, "meal-prep");
  assert.equal(transition(reflection, { type: "SKIP_FEEDBACK" }).screen, "meal-prep");

  const shifting = transition(prep, { type: "SET_MEAL_REMINDER" });
  assert.equal(shifting.screen, "demo-time-shift");
  const meal = transition(shifting, { type: "DEMO_TIME_REACHED" });
  assert.equal(meal.screen, "meal-time");
});

test("starts the meal and resets the repeatable demo", () => {
  const meal = { ...createInitialState(), screen: "meal-time", secondsRemaining: 0 };
  assert.deepEqual(transition(meal, { type: "START_MEAL" }), createInitialState());
});

test("formats countdown values as minutes and seconds", () => {
  assert.equal(formatTime(20), "00:20");
  assert.equal(formatTime(263), "04:23");
  assert.equal(formatTime(0), "00:00");
});
