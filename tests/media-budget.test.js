import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import test from "node:test";

const videoBudgets = new Map([
  ["video-meditation.mp4", 1_250_000],
  ["video-meditation-complete.mp4", 2_100_000],
  ["video-greeting.mp4", 500_000],
  ["video-meal-prep.mp4", 1_100_000],
  ["video-meal-cook.mp4", 1_100_000],
]);

function assetUrl(name) {
  return new URL(`../assets/${name}`, import.meta.url);
}

test("keeps every production video within its byte budget", () => {
  let total = 0;
  for (const [name, maximum] of videoBudgets) {
    const size = statSync(assetUrl(name)).size;
    total += size;
    assert.ok(size <= maximum, `${name} is ${size} bytes; maximum is ${maximum}`);
  }
  assert.ok(total <= 6_050_000, `production videos total ${total} bytes`);
});

test("uses the budgeted WebP room background", () => {
  assert.equal(existsSync(assetUrl("room.png")), false);
  const size = statSync(assetUrl("room.webp")).size;
  assert.ok(size <= 550_000, `room.webp is ${size} bytes`);
});
