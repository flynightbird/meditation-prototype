import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmbedMessage,
  isDemoControlMessage,
  isEmbedMode,
  isTrainerDemoMode,
} from "../src/embed-bridge.js";

test("recognizes explicit embed mode", () => {
  assert.equal(isEmbedMode("?embed=1"), true);
  assert.equal(isEmbedMode("?embed=0"), false);
  assert.equal(isEmbedMode(""), false);
});

test("recognizes the constrained embedded trainer demo mode", () => {
  assert.equal(isTrainerDemoMode("?embed=1&demo=trainer"), true);
  assert.equal(isTrainerDemoMode("?demo=trainer"), false);
  assert.equal(isTrainerDemoMode("?embed=1&demo=coach"), false);
});

test("accepts only portfolio play and pause messages", () => {
  assert.equal(isDemoControlMessage({
    source: "growth-base-portfolio",
    type: "growth-base:demo-control",
    action: "play",
  }), true);
  assert.equal(isDemoControlMessage({
    source: "growth-base-portfolio",
    type: "growth-base:demo-control",
    action: "reset",
  }), false);
});

test("creates a constrained view message", () => {
  assert.deepEqual(createEmbedMessage("trainer"), {
    source: "growth-base-prototype",
    type: "growth-base:view",
    view: "trainer",
  });
  assert.throws(() => createEmbedMessage("points"), /Unsupported embedded view/);
});
