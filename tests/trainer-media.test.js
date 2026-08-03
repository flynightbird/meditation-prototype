import assert from "node:assert/strict";
import test from "node:test";

import { loadDeferredTrainerImages } from "../src/trainer-booking-view.js";

function fakeImage(deferredSource, initialSource = null) {
  const attributes = new Map();
  if (initialSource) attributes.set("src", initialSource);
  return {
    dataset: { deferredSrc: deferredSource },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };
}

test("loads each deferred trainer image once", () => {
  const hero = fakeImage("./assets/trainer-hero.png");
  const map = fakeImage("./assets/trainer-map.png");

  assert.equal(loadDeferredTrainerImages([hero, map]), true);
  assert.equal(hero.getAttribute("src"), "./assets/trainer-hero.png");
  assert.equal(map.getAttribute("src"), "./assets/trainer-map.png");
  assert.equal(loadDeferredTrainerImages([hero, map]), false);
});

test("preserves an image source that is already present", () => {
  const image = fakeImage("./assets/trainer-map.png", "./assets/custom-map.png");
  assert.equal(loadDeferredTrainerImages([image]), false);
  assert.equal(image.getAttribute("src"), "./assets/custom-map.png");
});
