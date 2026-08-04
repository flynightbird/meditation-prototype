import assert from "node:assert/strict";
import test from "node:test";

import {
  getBeforeState,
  setupPortfolioShowcase,
  shouldAutoplayPortfolioVideo,
} from "../src/portfolio-showcase.js";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createClassList() {
  const values = new Set();
  return {
    add(...names) {
      names.forEach((name) => values.add(name));
    },
    remove(...names) {
      names.forEach((name) => values.delete(name));
    },
    contains(name) {
      return values.has(name);
    },
  };
}

function createMediaQuery(matches, { legacy = false } = {}) {
  const listeners = new Set();
  const query = {
    matches,
    listenerCount: 0,
    removedCount: 0,
    setMatches(nextMatches) {
      query.matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches, media: "" }));
    },
  };

  const add = (listener) => {
    listeners.add(listener);
    query.listenerCount += 1;
  };
  const remove = (listener) => {
    listeners.delete(listener);
    query.removedCount += 1;
  };

  if (legacy) {
    query.addListener = add;
    query.removeListener = remove;
  } else {
    query.addEventListener = (_type, listener) => add(listener);
    query.removeEventListener = (_type, listener) => remove(listener);
  }

  return query;
}

function createPortfolioFixture({
  desktop = true,
  reducedMotion = false,
  includeBefore = true,
  includeObserver = true,
  legacyMediaQueries = false,
  playRejects = false,
} = {}) {
  const appListeners = new Map();
  const app = {
    addEventListener(type, listener) {
      appListeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      appListeners.delete(type);
    },
    clickNav(nav) {
      appListeners.get("click")?.({
        target: {
          closest(selector) {
            return selector === 'button[data-action="nav-tap"]'
              ? { dataset: { nav } }
              : null;
          },
        },
      });
    },
    listenerCount() {
      return appListeners.size;
    },
  };
  const desktopQuery = createMediaQuery(desktop, { legacy: legacyMediaQueries });
  const motionQuery = createMediaQuery(reducedMotion, { legacy: legacyMediaQueries });
  const before = { classList: createClassList() };
  const beforeImage = {
    src: "./assets/before-ai-coach.jpg",
    alt: "旧版 AI 教练页面",
    getAttribute(name) {
      return name === "src" ? this.src : null;
    },
  };
  const beforeCaption = { textContent: "AI 教练 · 原始界面" };
  const video = {
    playCount: 0,
    pauseCount: 0,
    play() {
      this.playCount += 1;
      return playRejects ? Promise.reject(new Error("autoplay denied")) : Promise.resolve();
    },
    pause() {
      this.pauseCount += 1;
    },
  };
  const observers = [];
  class FakeIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      this.disconnected = false;
      observers.push(this);
    }

    observe(target) {
      this.observed.push(target);
    }

    disconnect() {
      this.disconnected = true;
    }

    emit({ isIntersecting, intersectionRatio }) {
      this.callback([{ target: video, isIntersecting, intersectionRatio }]);
    }
  }
  const documentRef = {
    defaultView: {
      matchMedia(query) {
        return query === "(min-width: 900px)" ? desktopQuery : motionQuery;
      },
      setTimeout,
      clearTimeout,
      ...(includeObserver ? { IntersectionObserver: FakeIntersectionObserver } : {}),
    },
    querySelector(selector) {
      if (!includeBefore) return null;
      return {
        ".portfolio-before": before,
        "#portfolioBeforeImage": beforeImage,
        "#portfolioBeforeCaption": beforeCaption,
      }[selector] ?? null;
    },
    querySelectorAll(selector) {
      return selector === ".portfolio-video" ? [video] : [];
    },
  };
  app.ownerDocument = documentRef;

  return { app, before, beforeCaption, beforeImage, desktopQuery, motionQuery, observers, video };
}

test("maps the coach navigation to its original Before state", () => {
  assert.deepEqual(getBeforeState("coach"), {
    src: "./assets/before-ai-coach.jpg",
    alt: "旧版 AI 教练页面",
    caption: "AI 教练 · 原始界面",
  });
});

test("maps trainer while leaving unrelated navigation without a Before state", () => {
  assert.deepEqual(getBeforeState("trainer"), {
    src: "./assets/before-private-trainer.jpg",
    alt: "旧版预约私教页面",
    caption: "预约私教 · 原始界面",
  });
  assert.equal(getBeforeState("skill"), null);
  assert.equal(getBeforeState("anything-else"), null);
});

test("autoplays a portfolio video only for desktop visible media without reduced motion", () => {
  assert.equal(
    shouldAutoplayPortfolioVideo({
      isDesktop: true,
      reducedMotion: false,
      isIntersecting: true,
    }),
    true,
  );

  for (const state of [
    { isDesktop: false, reducedMotion: false, isIntersecting: true },
    { isDesktop: true, reducedMotion: true, isIntersecting: true },
    { isDesktop: true, reducedMotion: false, isIntersecting: false },
  ]) {
    assert.equal(shouldAutoplayPortfolioVideo(state), false);
  }
});

test("cleanup cancels a pending Before fade and removes controller resources", async () => {
  const fixture = createPortfolioFixture();
  const cleanup = setupPortfolioShowcase({ app: fixture.app, reducedMotion: fixture.motionQuery });

  fixture.app.clickNav("trainer");
  assert.equal(fixture.before.classList.contains("is-switching"), true);
  cleanup();

  assert.equal(fixture.before.classList.contains("is-switching"), false);
  assert.equal(fixture.app.listenerCount(), 0);
  assert.equal(fixture.desktopQuery.removedCount, 1);
  assert.equal(fixture.motionQuery.removedCount, 1);
  assert.equal(fixture.observers[0].disconnected, true);
  await wait(140);
  assert.equal(fixture.beforeImage.src, "./assets/before-ai-coach.jpg");
});

test("a desktop fade is cancelled on mobile and syncs the active Before state when desktop returns", async () => {
  const fixture = createPortfolioFixture();
  const cleanup = setupPortfolioShowcase({ app: fixture.app, reducedMotion: fixture.motionQuery });

  fixture.app.clickNav("trainer");
  fixture.desktopQuery.setMatches(false);
  assert.equal(fixture.before.classList.contains("is-switching"), false);
  await wait(140);
  assert.equal(fixture.beforeImage.src, "./assets/before-ai-coach.jpg");

  fixture.desktopQuery.setMatches(true);
  await wait(140);
  assert.equal(fixture.beforeImage.src, "./assets/before-private-trainer.jpg");
  cleanup();
});

test("missing DOM and IntersectionObserver degrade without autoplay", () => {
  const missingDom = createPortfolioFixture({ includeBefore: false });
  assert.doesNotThrow(() => setupPortfolioShowcase({ app: missingDom.app, reducedMotion: missingDom.motionQuery }));

  const noObserver = createPortfolioFixture({ includeObserver: false });
  const cleanup = setupPortfolioShowcase({ app: noObserver.app, reducedMotion: noObserver.motionQuery });
  noObserver.desktopQuery.setMatches(true);
  assert.equal(noObserver.video.playCount, 0);
  cleanup();
});

test("observer playback follows visibility and media conditions without replaying a manual pause", async () => {
  const fixture = createPortfolioFixture({ playRejects: true });
  const cleanup = setupPortfolioShowcase({ app: fixture.app, reducedMotion: fixture.motionQuery });
  const observer = fixture.observers[0];

  observer.emit({ isIntersecting: true, intersectionRatio: 0.2 });
  await wait(0);
  assert.equal(fixture.video.playCount, 1);
  fixture.video.pause();
  await wait(0);
  assert.equal(fixture.video.playCount, 1);

  observer.emit({ isIntersecting: false, intersectionRatio: 0 });
  assert.ok(fixture.video.pauseCount >= 2);
  fixture.desktopQuery.setMatches(false);
  assert.ok(fixture.video.pauseCount >= 3);
  fixture.motionQuery.setMatches(true);
  assert.ok(fixture.video.pauseCount >= 4);
  cleanup();
});

test("legacy MediaQueryList listeners are subscribed and removed safely", () => {
  const fixture = createPortfolioFixture({ legacyMediaQueries: true });
  const cleanup = setupPortfolioShowcase({ app: fixture.app, reducedMotion: fixture.motionQuery });

  assert.equal(fixture.desktopQuery.listenerCount, 1);
  assert.equal(fixture.motionQuery.listenerCount, 1);
  assert.doesNotThrow(cleanup);
  assert.equal(fixture.desktopQuery.removedCount, 1);
  assert.equal(fixture.motionQuery.removedCount, 1);
});
