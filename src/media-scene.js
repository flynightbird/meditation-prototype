const SCENES = {
  recommendation: {
    src: "./assets/video-meditation.mp4",
    loopMode: "segment",
    segmentEnd: 2,
    muted: true,
    seamMask: false,
  },
  active: {
    src: "./assets/video-meditation.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
  completion: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "none",
    muted: false,
    seamMask: false,
  },
  reward: {
    src: "./assets/video-greeting.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
  "reward-settled": {
    src: "./assets/video-greeting.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
  "meal-prep": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
  "demo-time-shift": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
  "meal-time": {
    src: "./assets/video-meal-cook.mp4",
    loopMode: "full",
    muted: false,
    seamMask: false,
  },
};

const NEXT_MEDIA_SOURCES = Object.freeze({
  active: "./assets/video-meditation-complete.mp4",
  completion: "./assets/video-greeting.mp4",
  reward: "./assets/video-meal-prep.mp4",
  "reward-settled": "./assets/video-meal-prep.mp4",
  "meal-prep": "./assets/video-meal-cook.mp4",
  "demo-time-shift": "./assets/video-meal-cook.mp4",
});

export function getMediaScene(screen) {
  return SCENES[screen] ?? null;
}

export function getNextMediaSource(screen) {
  return NEXT_MEDIA_SOURCES[screen] ?? null;
}

export function getReplayTime(screen, duration) {
  const scene = getMediaScene(screen);
  if (!scene || scene.loopMode === "none") return null;
  return 0;
}

export function shouldReplaySegment(screen, currentTime) {
  const scene = getMediaScene(screen);
  return scene?.loopMode === "segment" && currentTime >= scene.segmentEnd;
}

export function shouldRunMediaTimer({ screen, isPaused, mediaReady }) {
  return screen === "active" && !isPaused && mediaReady;
}
