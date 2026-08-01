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
    src: "./assets/video-greeting.mp4",
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
    seamMask: true,
  },
  "demo-time-shift": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    muted: false,
    seamMask: true,
  },
  "meal-time": {
    src: "./assets/video-meal-cook.mp4",
    loopMode: "full",
    muted: false,
    seamMask: true,
  },
};

export function getMediaScene(screen) {
  return SCENES[screen] ?? null;
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
