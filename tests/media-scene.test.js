import assert from "node:assert/strict";
import test from "node:test";

import * as mediaScene from "../src/media-scene.js";

const { getMediaScene, getReplayTime, shouldRunMediaTimer } = mediaScene;

test("maps application states to video-only media scenes", () => {
  const recommendation = getMediaScene("recommendation");
  assert.equal(recommendation.src, "./assets/video-meditation.mp4");
  assert.equal(recommendation.muted, true);
  assert.equal(recommendation.segmentEnd, 2);

  assert.equal(getMediaScene("active").muted, false);
  assert.equal(
    getMediaScene("completion").src,
    "./assets/video-meditation-complete.mp4",
  );
  assert.equal(getMediaScene("completion").loopMode, "none");
  assert.equal(getMediaScene("reward").src, "./assets/video-greeting.mp4");
  assert.equal(getMediaScene("reward").loopMode, "full");
  assert.equal(getMediaScene("reward-settled").src, "./assets/video-greeting.mp4");
  assert.equal(getMediaScene("reward-settled").loopMode, "full");
  assert.equal(getMediaScene("meal-prep").seamMask, false);
  assert.equal(getMediaScene("demo-time-shift").seamMask, false);
  assert.equal(getMediaScene("meal-time").seamMask, false);
});

test("calculates approved replay positions", () => {
  assert.equal(getReplayTime("recommendation", 10.08), 0);
  assert.equal(getReplayTime("reward", 10.08), 0);
  assert.equal(getReplayTime("reward-settled", 10.08), 0);
  assert.equal(getReplayTime("active", 10.08), 0);
  assert.equal(getReplayTime("completion", 10.08), null);
});

test("loops the recommendation when it reaches two seconds", () => {
  assert.equal(typeof mediaScene.shouldReplaySegment, "function");
  const { shouldReplaySegment } = mediaScene;
  assert.equal(shouldReplaySegment("recommendation", 1.99), false);
  assert.equal(shouldReplaySegment("recommendation", 2), true);
  assert.equal(shouldReplaySegment("active", 2), false);
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
