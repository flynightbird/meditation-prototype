const SCENES = {
  active: {
    src: "./assets/video-meditation.mp4",
    loopMode: "full",
    seamMask: false,
  },
  completion: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "none",
    seamMask: false,
  },
  reward: {
    src: "./assets/video-meditation-complete.mp4",
    loopMode: "tail",
    seamMask: false,
  },
  "meal-prep": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    seamMask: true,
  },
  "demo-time-shift": {
    src: "./assets/video-meal-prep.mp4",
    loopMode: "full",
    seamMask: true,
  },
  "meal-time": {
    src: "./assets/video-meal-cook.mp4",
    loopMode: "full",
    seamMask: true,
  },
};

export function getMediaScene(screen) {
  return SCENES[screen] ?? null;
}

export function getReplayTime(screen, duration) {
  const scene = getMediaScene(screen);
  if (!scene || scene.loopMode === "none") return null;
  if (scene.loopMode === "tail") {
    return Math.max(0, Number((duration - 2.5).toFixed(2)));
  }
  return 0;
}
