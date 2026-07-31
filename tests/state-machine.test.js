import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialState,
  formatTime,
  transition,
} from "../src/state-machine.js";

test("starts in the recommendation state with five minutes remaining", () => {
  assert.deepEqual(createInitialState(), {
    screen: "recommendation",
    secondsRemaining: 300,
    isPaused: false,
    mood: null,
    claimMode: null,
  });
});

test("starts, pauses, resumes, and ends meditation at the reward", () => {
  let state = transition(createInitialState(), { type: "START" });
  assert.equal(state.screen, "active");

  state = transition(state, { type: "TOGGLE_PAUSE" });
  assert.equal(state.isPaused, true);

  state = transition(state, { type: "TOGGLE_PAUSE" });
  assert.equal(state.isPaused, false);

  state = transition(state, { type: "END" });
  assert.equal(state.screen, "reward");
  assert.equal(state.claimMode, "full");
});

test("timer ticks only while meditation is active and running", () => {
  const active = transition(createInitialState(), { type: "START" });
  assert.equal(transition(active, { type: "TICK" }).secondsRemaining, 299);

  const paused = transition(active, { type: "TOGGLE_PAUSE" });
  assert.equal(transition(paused, { type: "TICK" }).secondsRemaining, 300);
});

test("timer completion opens the automatic reward", () => {
  const state = {
    ...createInitialState(),
    screen: "active",
    secondsRemaining: 1,
  };
  const reward = transition(state, { type: "TICK" });
  assert.equal(reward.screen, "reward");
  assert.equal(reward.claimMode, "full");
});

test("a full claim leads to optional feedback and then the next task", () => {
  const reward = {
    ...createInitialState(),
    screen: "reward",
    secondsRemaining: 0,
    claimMode: "full",
  };

  const reflection = transition(reward, { type: "CLAIM_COMPLETE" });
  assert.equal(reflection.screen, "reflection");
  assert.equal(reflection.claimMode, null);

  const confirmed = transition(reflection, {
    type: "SELECT_MOOD",
    mood: "lighter",
  });
  assert.equal(confirmed.screen, "feedback-confirmed");
  assert.equal(confirmed.mood, "lighter");

  const next = transition(confirmed, { type: "FEEDBACK_COMPLETE" });
  assert.equal(next.screen, "next-task");
});

test("feedback may time out without blocking the next task", () => {
  const reflection = {
    ...createInitialState(),
    screen: "reflection",
    secondsRemaining: 0,
  };
  assert.equal(
    transition(reflection, { type: "SKIP_FEEDBACK" }).screen,
    "next-task",
  );
});

test("an interrupted claim resumes briefly and returns to the next task", () => {
  const resumed = createInitialState({ resumeClaim: true });
  assert.equal(resumed.screen, "reward");
  assert.equal(resumed.claimMode, "resume");
  assert.equal(
    transition(resumed, { type: "CLAIM_COMPLETE" }).screen,
    "next-task",
  );
});

test("formats countdown values as minutes and seconds", () => {
  assert.equal(formatTime(300), "05:00");
  assert.equal(formatTime(263), "04:23");
  assert.equal(formatTime(0), "00:00");
});
