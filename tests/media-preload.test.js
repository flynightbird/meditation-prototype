import assert from "node:assert/strict";
import test from "node:test";

import { syncPreloadSource } from "../src/media-preload.js";

function fakeVideo(initialSource = null) {
  const attributes = new Map();
  if (initialSource) attributes.set("src", initialSource);
  return {
    muted: false,
    loadCalls: 0,
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    load() {
      this.loadCalls += 1;
    },
  };
}

test("loads a new next source and forces the preloader muted", () => {
  const video = fakeVideo();
  assert.equal(syncPreloadSource(video, "./next.mp4"), true);
  assert.equal(video.getAttribute("src"), "./next.mp4");
  assert.equal(video.muted, true);
  assert.equal(video.loadCalls, 1);
});

test("does not reload an identical next source", () => {
  const video = fakeVideo("./next.mp4");
  assert.equal(syncPreloadSource(video, "./next.mp4"), false);
  assert.equal(video.loadCalls, 0);
});

test("clears a stale preload when no next source exists", () => {
  const video = fakeVideo("./next.mp4");
  assert.equal(syncPreloadSource(video, null), true);
  assert.equal(video.getAttribute("src"), null);
  assert.equal(video.loadCalls, 1);

  assert.equal(syncPreloadSource(video, null), false);
  assert.equal(video.loadCalls, 1);
});
