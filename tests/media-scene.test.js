import assert from "node:assert/strict";
import test from "node:test";

import { getMediaScene, getReplayTime, shouldRunMediaTimer } from "../src/media-scene.js";

test("maps application states to the approved media assets", () => {
  assert.equal(getMediaScene("recommendation"), null);
  assert.equal(getMediaScene("active").src, "./assets/video-meditation.mp4");
  assert.equal(getMediaScene("completion").src, "./assets/video-meditation-complete.mp4");
  assert.equal(getMediaScene("reward").loopMode, "tail");
  assert.equal(getMediaScene("meal-prep").seamMask, true);
  assert.equal(getMediaScene("meal-time").src, "./assets/video-meal-cook.mp4");
});

test("replays the reward from the final two and a half seconds", () => {
  assert.equal(getReplayTime("reward", 10.08), 7.58);
  assert.equal(getReplayTime("active", 10.08), 0);
  assert.equal(getReplayTime("meal-prep", 10.08), 0);
  assert.equal(getReplayTime("completion", 10.08), null);
});

test("starts the meditation timer only after media playback is ready", () => {
  assert.equal(
    shouldRunMediaTimer({ screen: "active", isPaused: false, mediaReady: false }),
    false,
  );
  assert.equal(
    shouldRunMediaTimer({ screen: "active", isPaused: false, mediaReady: true }),
    true,
  );
  assert.equal(
    shouldRunMediaTimer({ screen: "active", isPaused: true, mediaReady: true }),
    false,
  );
  assert.equal(
    shouldRunMediaTimer({ screen: "recommendation", isPaused: false, mediaReady: true }),
    false,
  );
});
