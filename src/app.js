import {
  buildSchedule,
  canPlayAutomaticHaptic,
  getGreetingKey,
  getLocalDateKey,
  shouldPlayDailyWelcome,
} from "./experience.js";
import {
  getMediaScene,
  getNextMediaSource,
  getReplayTime,
  shouldReplaySegment,
  shouldRunMediaTimer,
} from "./media-scene.js";
import { syncPreloadSource } from "./media-preload.js";
import { createInitialState, formatTime, transition } from "./state-machine.js";
import { mountTrainerBooking } from "./trainer-booking-view.js";
import {
  addTaskReward,
  collectBubble,
  createGrowthState,
  getDailyProgress,
  getVisibleBubbles,
  normalizeGrowthState,
  previewBubbleCollection,
} from "./growth.js";
import { getGrowthStatItems } from "./growth-stats.js";
import { applyDocumentTranslations, t } from "./i18n.js";

applyDocumentTranslations(document);

const WELCOME_KEY = "growth-base.welcome-date";
const CLAIM_KEY = "growth-base.tent-claim";
const TENT_SEEN_KEY = "growth-base.tent-seen";
const GROWTH_KEY = "growth-base.growth-state";

const app = document.querySelector("#app");
const message = document.querySelector("#message");
const timerPanel = document.querySelector("#timerPanel");
const actionZone = document.querySelector("#actionZone");
const taskRail = document.querySelector("#taskRail");
const bottomNav = document.querySelector(".bottom-nav");
const toast = document.querySelector("#toast");
const rewardObject = document.querySelector("#rewardObject");
const objectDialog = document.querySelector("#objectDialog");
const welcomeOverlay = document.querySelector("#welcomeOverlay");
const welcomeGreeting = document.querySelector("#welcomeGreeting");
const sceneVideo = document.querySelector("#sceneVideo");
const scenePreloader = document.querySelector("#scenePreloader");
const claimReward = document.querySelector("#claimReward");
const rewardLayer = document.querySelector("#rewardLayer");
const growthBubbleLayer = document.querySelector("#growthBubbleLayer");
const growthStats = document.querySelector("#growthStats");
const trainerBooking = mountTrainerBooking({
  app,
  bottomNav,
  sceneVideo,
  onShow: pauseHomeExperience,
  onHide: resumeHomeExperience,
});
const deferredRewardImages = [...document.querySelectorAll("img[data-deferred-src]")];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let state = createInitialState();
let growthState = loadGrowthState();
let previousScreen = null;
let timerId = null;
let countdownCompleteTimer = null;
let settledUiTimer = null;
let rewardToMealTimer = null;
let rewardVeilTimer = null;
let demoShiftTimer = null;
let mediaVeilTimer = null;
let claimDispatchTimer = null;
let welcomeTimer = null;
let welcomeHapticTimer = null;
let toastTimer = null;
let rewardImagesRequested = false;
const statRollQueues = new Map();

const assets = {
  meal: "./assets/task-meal.png?v=20260802",
  meditation: "./assets/task-meditation.png?v=20260802",
  fitness: "./assets/task-fitness.png?v=20260802",
  water: "./assets/task-water.png?v=20260802",
};

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The prototype remains usable when storage is unavailable.
  }
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // The prototype remains usable when storage is unavailable.
  }
}

function loadGrowthState() {
  const dateKey = getLocalDateKey();
  const raw = readStorage(GROWTH_KEY);
  if (!raw) return createGrowthState(dateKey, { initialProgress: 3 });
  try {
    return normalizeGrowthState(JSON.parse(raw), dateKey);
  } catch {
    return createGrowthState(dateKey, { initialProgress: 3 });
  }
}

function writeGrowthState(nextState) {
  try {
    window.localStorage.setItem(GROWTH_KEY, JSON.stringify(nextState));
    return true;
  } catch {
    return false;
  }
}

function renderGrowthBubbles() {
  growthBubbleLayer.innerHTML = getVisibleBubbles(growthState)
    .map((bubble, index) => {
      const item = getGrowthStatItem(bubble.attribute);
      const label = t(item.labelKey);
      return `
      <button
        class="growth-bubble bubble-${bubble.attribute} anchor-${index + 1}"
        type="button"
        data-action="collect-growth"
        data-reward-ids="${bubble.rewardIds.join(",")}"
        data-growth-attribute="${bubble.attribute}"
        data-growth-value="${bubble.value}"
        aria-label="${t("growth.collectAria", { label, value: bubble.value })}"
        style="--bubble-index:${index}"
      >
        <span class="growth-bubble-label">
          <img src="${item.icon}" alt="" />
          <small>${label}</small>
        </span>
        <strong>+${bubble.value}</strong>
      </button>`;
    })
    .join("");
}

function statMainContent({ mode, icon, total }) {
  return mode === "icon"
    ? `<img class="growth-stat-icon" src="${icon}" alt="" />`
    : `<strong class="growth-stat-value">${total}</strong>`;
}

function renderGrowthStats() {
  growthStats.innerHTML = getGrowthStatItems(growthState.totals)
    .map(({ attribute, labelKey, total, mode, icon }) => {
      const label = t(labelKey);
      return `
      <div class="growth-stat growth-stat-${attribute}" data-growth-stat="${attribute}" aria-label="${t("growth.statAria", { label, value: total })}">
        <span class="growth-stat-main">${statMainContent({ mode, icon, total })}</span>
        <span class="growth-stat-label">${label}</span>
      </div>`;
    })
    .join("");
}

function getGrowthStatItem(attribute, total = growthState.totals[attribute]) {
  return getGrowthStatItems({ ...growthState.totals, [attribute]: total })
    .find((item) => item.attribute === attribute);
}

function updateGrowthStat(attribute, total, { pulse = false } = {}) {
  const stat = growthStats.querySelector(`[data-growth-stat="${attribute}"]`);
  if (!stat) return;
  const item = getGrowthStatItem(attribute, total);
  const main = stat.querySelector(".growth-stat-main");
  main.classList.remove("is-rolling", "is-updated");
  main.innerHTML = statMainContent({ ...item, total, mode: total === 0 ? "icon" : "value" });
  stat.setAttribute("aria-label", t("growth.statAria", { label: t(item.labelKey), value: total }));
  if (pulse) {
    void main.offsetWidth;
    main.classList.add("is-updated");
    window.setTimeout(() => main.classList.remove("is-updated"), 220);
  }
}

function playGrowthStatRoll({ attribute, increment, previousTotal, nextTotal }) {
  const stat = growthStats.querySelector(`[data-growth-stat="${attribute}"]`);
  if (!stat) return Promise.resolve();
  const item = getGrowthStatItem(attribute, previousTotal);
  const main = stat.querySelector(".growth-stat-main");
  const firstFace = statMainContent({
    ...item,
    total: previousTotal,
    mode: previousTotal === 0 ? "icon" : "value",
  });
  main.innerHTML = `<span class="growth-stat-roll-track">
    <span class="growth-stat-roll-face">${firstFace}</span>
    <span class="growth-stat-roll-face growth-stat-roll-increment"><img src="${item.icon}" alt="" /><b>+${increment}</b></span>
    <span class="growth-stat-roll-face"><strong class="growth-stat-value">${nextTotal}</strong></span>
  </span>`;
  main.classList.add("is-rolling");

  return new Promise((resolve) => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      window.clearTimeout(fallbackTimer);
      main.removeEventListener("animationend", handleAnimationEnd);
      updateGrowthStat(attribute, nextTotal);
      resolve();
    };
    const handleAnimationEnd = (event) => {
      if (event.animationName === "growth-stat-roll") finish();
    };
    const fallbackTimer = window.setTimeout(finish, 1380);
    main.addEventListener("animationend", handleAnimationEnd);
  });
}

function queueGrowthStatRoll(preview) {
  const previous = statRollQueues.get(preview.attribute) || Promise.resolve();
  const next = previous.catch(() => {}).then(() => playGrowthStatRoll(preview));
  statRollQueues.set(preview.attribute, next);
  next.finally(() => {
    if (statRollQueues.get(preview.attribute) === next) statRollQueues.delete(preview.attribute);
  });
  return next;
}

function addMeditationGrowthReward() {
  const dateKey = getLocalDateKey();
  const nextState = addTaskReward(growthState, {
    id: `${dateKey}:meditation`,
    taskId: "meditation",
    attribute: "focus",
    value: 10,
    createdAt: Date.now(),
  });
  if (nextState === growthState || !writeGrowthState(nextState)) return;
  growthState = nextState;
  renderGrowthBubbles();
}

function commitGrowthCollection(button, rewardIds, preview, { animate = true } = {}) {
  const nextState = collectBubble(growthState, rewardIds);
  if (nextState !== growthState && writeGrowthState(nextState)) {
    growthState = nextState;
    renderGrowthBubbles();
    if (animate) queueGrowthStatRoll(preview);
    else updateGrowthStat(preview.attribute, preview.nextTotal, { pulse: true });
    return;
  }
  button.classList.remove("is-collecting");
  button.disabled = false;
}

function collectGrowthReward(button) {
  if (button.classList.contains("is-collecting")) return;
  const rewardIds = button.dataset.rewardIds.split(",").filter(Boolean);
  const preview = previewBubbleCollection(growthState, rewardIds);
  const target = preview
    && growthStats.querySelector(`[data-growth-stat="${preview.attribute}"] .growth-stat-main`);
  if (!preview || !target) return;

  button.disabled = true;
  if (reducedMotion.matches) {
    commitGrowthCollection(button, rewardIds, preview, { animate: false });
    return;
  }

  const sourceRect = button.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const layerRect = growthBubbleLayer.getBoundingClientRect();
  button.style.setProperty(
    "--collect-start-x",
    `${sourceRect.left - layerRect.left}px`,
  );
  button.style.setProperty(
    "--collect-start-y",
    `${sourceRect.top - layerRect.top}px`,
  );
  button.style.setProperty(
    "--collect-end-x",
    `${targetRect.left + targetRect.width / 2 - sourceRect.width / 2 - layerRect.left}px`,
  );
  button.style.setProperty(
    "--collect-end-y",
    `${targetRect.top + targetRect.height / 2 - sourceRect.height / 2 - layerRect.top}px`,
  );
  button.classList.add("is-collecting");

  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    window.clearTimeout(fallbackTimer);
    button.removeEventListener("animationend", handleAnimationEnd);
    commitGrowthCollection(button, rewardIds, preview);
  };
  const handleAnimationEnd = (event) => {
    if (event.animationName === "collect-growth-bubble") finish();
  };
  const fallbackTimer = window.setTimeout(finish, 1200);
  button.addEventListener("animationend", handleAnimationEnd);
}

function taskCard({ id, time, labelKey, icon, reward, status }) {
  const current = status === "current";
  const done = status === "done";
  const label = t(labelKey);
  const rewardLabel = t(reward.labelKey);
  const statusText = done
    ? t("task.completedAria")
    : current
      ? t("task.currentAria")
      : "";
  return `
    <article class="task-card is-${status}" data-task-id="${id}" data-task-icon="${icon}" ${current ? 'aria-current="step"' : ""} aria-label="${t("task.cardAria", { time, label, reward: rewardLabel, value: reward.value, status: statusText })}">
      ${current ? `<span class="current-label">${t("task.current")}</span>` : ""}
      ${done ? '<svg class="check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z"></path></svg>' : ""}
      <span class="task-visual"><img src="${assets[icon]}" alt="" /></span>
      <span class="task-copy">
        <time>${time}</time>
        <span class="task-details">
          <strong>${label}</strong>
          <span class="task-reward reward-${reward.attribute}" aria-hidden="true"><small>${rewardLabel}</small><b>+${reward.value}</b></span>
        </span>
      </span>
    </article>`;
}

function renderSchedule() {
  taskRail.innerHTML = buildSchedule(state.screen).map(taskCard).join("");
}

function centerCurrentTask(behavior = "smooth") {
  window.requestAnimationFrame(() => {
    const current = taskRail.querySelector(".is-current");
    if (!current) return;
    const left = current.offsetLeft - (taskRail.clientWidth - current.offsetWidth) / 2;
    taskRail.scrollTo({
      left,
      behavior: reducedMotion.matches ? "auto" : behavior,
    });
  });
}

function growthCue() {
  const progress = getDailyProgress(growthState);
  const key = progress === 4 ? "growth.progressEarned" : "growth.progressPending";
  return `<p class="growth-cue">${t(key, { progress })}</p>`;
}

function setTimerRunning() {
  window.clearInterval(timerId);
  timerId = null;
  const canRun =
    state.secondsRemaining > 0 &&
    shouldRunMediaTimer({
      screen: state.screen,
      isPaused: state.isPaused,
      mediaReady:
        sceneVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !sceneVideo.paused,
    });
  app.classList.toggle("is-timer-running", canRun);
  if (canRun) {
    timerId = window.setInterval(() => {
      state = transition(state, { type: "TICK" });
      render(false);
    }, 1000);
  }
}

function clearScreenTimers() {
  window.clearTimeout(countdownCompleteTimer);
  window.clearTimeout(settledUiTimer);
  window.clearTimeout(rewardToMealTimer);
  window.clearTimeout(rewardVeilTimer);
  window.clearTimeout(demoShiftTimer);
  window.clearTimeout(mediaVeilTimer);
  window.clearTimeout(claimDispatchTimer);
  countdownCompleteTimer = null;
  settledUiTimer = null;
  rewardToMealTimer = null;
  rewardVeilTimer = null;
  demoShiftTimer = null;
  mediaVeilTimer = null;
  claimDispatchTimer = null;
}

function pauseHomeExperience() {
  clearScreenTimers();
  window.clearInterval(timerId);
  timerId = null;
  app.classList.remove("is-timer-running");
  sceneVideo.pause();
}

function resumeHomeExperience() {
  scheduleScreenEntry(state.screen);
  playCurrentScene({ fromScreen: state.screen });
}

function stopMedia() {
  sceneVideo.pause();
  sceneVideo.removeAttribute("src");
  sceneVideo.load();
  app.classList.remove("has-media", "is-media-veiled", "is-time-shifting");
}

function playCurrentScene({ fromScreen = null } = {}) {
  if (trainerBooking.isVisible()) {
    sceneVideo.pause();
    return;
  }
  const scene = getMediaScene(state.screen);
  if (!scene) {
    stopMedia();
    return;
  }

  const sourceChanged = sceneVideo.getAttribute("src") !== scene.src;
  sceneVideo.muted = scene.muted;
  app.classList.remove("media-failed");
  if (sourceChanged) {
    sceneVideo.pause();
    sceneVideo.src = scene.src;
    sceneVideo.load();
  }

  app.classList.add("has-media");

  const startPlayback = () => {
    if (trainerBooking.isVisible()) {
      sceneVideo.pause();
      return;
    }
    if (["reward", "reward-settled"].includes(state.screen)) {
      sceneVideo.currentTime = getReplayTime(state.screen, sceneVideo.duration);
    }

    if (state.screen === "active" && fromScreen === "recommendation") {
      sceneVideo.currentTime = 0;
    }

    if (state.screen === "active" && state.isPaused) {
      sceneVideo.pause();
    } else {
      sceneVideo.play().catch(() => {});
    }

    if (state.screen === "meal-time" && fromScreen === "demo-time-shift") {
      window.clearTimeout(mediaVeilTimer);
      mediaVeilTimer = window.setTimeout(() => {
        app.classList.remove("is-media-veiled", "is-time-shifting");
      }, 300);
    }

    if (state.screen === "meal-prep" && fromScreen === "reward-settled") {
      window.clearTimeout(mediaVeilTimer);
      mediaVeilTimer = window.setTimeout(() => {
        app.classList.remove("is-media-veiled");
      }, reducedMotion.matches ? 1 : 350);
    }
  };

  if (sourceChanged && sceneVideo.readyState < HTMLMediaElement.HAVE_METADATA) {
    sceneVideo.addEventListener("loadedmetadata", startPlayback, { once: true });
  } else {
    startPlayback();
  }
}

function replayCurrentMedia() {
  const replayAt = getReplayTime(state.screen, sceneVideo.duration);
  if (replayAt === null) {
    dispatch({ type: "COMPLETION_VIDEO_ENDED" });
    return;
  }
  sceneVideo.currentTime = replayAt;
  sceneVideo.play().catch(() => {});
}

sceneVideo.addEventListener("timeupdate", () => {
  if (shouldReplaySegment(state.screen, sceneVideo.currentTime)) {
    sceneVideo.currentTime = getReplayTime(state.screen, sceneVideo.duration);
    sceneVideo.play().catch(() => {});
    return;
  }

  const scene = getMediaScene(state.screen);
  if (!scene?.seamMask || !Number.isFinite(sceneVideo.duration)) return;
  if (sceneVideo.duration - sceneVideo.currentTime <= 0.6) {
    app.classList.add("is-media-veiled");
  }
});

sceneVideo.addEventListener("ended", () => {
  replayCurrentMedia();
  const scene = getMediaScene(state.screen);
  if (scene?.seamMask) {
    window.clearTimeout(mediaVeilTimer);
    mediaVeilTimer = window.setTimeout(() => {
      app.classList.remove("is-media-veiled");
    }, 300);
  }
});

sceneVideo.addEventListener("playing", setTimerRunning);

sceneVideo.addEventListener("error", () => {
  app.classList.add("media-failed");
});

function ensureRewardImages() {
  if (rewardImagesRequested) return;
  rewardImagesRequested = true;
  for (const image of deferredRewardImages) {
    const source = image.dataset.deferredSrc;
    if (source) image.src = source;
  }
}

function scheduleScreenEntry(fromScreen) {
  clearScreenTimers();

  if (state.screen === "completion") {
    ensureRewardImages();
  }

  if (state.screen !== "reward-settled") {
    app.classList.remove("is-settled-components-visible", "is-tent-dropping");
  }

  if (state.screen !== "reward") {
    app.classList.remove("is-reward-entered", "is-claiming");
  }

  if (state.screen === "reward") {
    if (fromScreen === "completion") addMeditationGrowthReward();
    app.classList.remove("is-reward-entered", "is-claiming");
    claimReward.classList.remove("is-claiming");
    void rewardLayer.offsetWidth;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => app.classList.add("is-reward-entered"));
    });
  }

  if (state.screen === "reward-settled") {
    app.classList.remove("is-settled-components-visible", "is-tent-dropping");
    window.requestAnimationFrame(() => app.classList.add("is-tent-dropping"));

    settledUiTimer = window.setTimeout(() => {
      app.classList.add("is-settled-components-visible");
      taskRail.setAttribute("aria-hidden", "false");
      bottomNav.setAttribute("aria-hidden", "false");
      renderSchedule();
      centerCurrentTask("smooth");
    }, reducedMotion.matches ? 1 : 1500);

    rewardToMealTimer = window.setTimeout(() => {
      app.classList.add("is-media-veiled");
      rewardVeilTimer = window.setTimeout(() => {
        dispatch({ type: "REWARD_SETTLE_COMPLETE" });
      }, reducedMotion.matches ? 1 : 350);
    }, 5000);
  }

  if (state.screen === "demo-time-shift") {
    showToast("toast.reminderSet");
    demoShiftTimer = window.setTimeout(() => {
      app.classList.add("is-time-shifting", "is-media-veiled");
      mediaVeilTimer = window.setTimeout(() => {
        dispatch({ type: "DEMO_TIME_REACHED" });
      }, 300);
    }, 900);
  }

  if (["recommendation", "meal-prep", "demo-time-shift", "meal-time"].includes(state.screen)) {
    centerCurrentTask(fromScreen === null ? "auto" : "smooth");
  }
}

function render(animate = true) {
  const screenChanged = previousScreen !== state.screen;
  app.dataset.screen = state.screen;
  growthStats.setAttribute("aria-hidden", String(state.screen === "active"));
  app.classList.toggle("is-paused", state.isPaused);
  app.classList.toggle("is-changing", animate && screenChanged);

  const settledComponentsVisible = app.classList.contains("is-settled-components-visible");
  const focused = ["active", "completion", "reward"].includes(state.screen) ||
    (state.screen === "reward-settled" && !settledComponentsVisible);
  const claimStatus = readStorage(CLAIM_KEY);
  const tentSettling = state.screen === "reward-settled";
  const hasTent = claimStatus === "claimed" && state.screen !== "reward";
  const canInspectTent = hasTent && !getMediaScene(state.screen);
  const showGroundTent = tentSettling || canInspectTent;
  const tentIsNew = canInspectTent && readStorage(TENT_SEEN_KEY) !== "true";
  const claimVisible = state.screen === "reward";

  app.classList.toggle("has-tent", showGroundTent);
  app.classList.toggle("is-tent-new", tentIsNew);
  taskRail.setAttribute("aria-hidden", String(focused));
  bottomNav.setAttribute("aria-hidden", String(focused));
  rewardObject.setAttribute("aria-hidden", String(!showGroundTent));
  rewardObject.tabIndex = canInspectTent ? 0 : -1;
  claimReward.hidden = !claimVisible;
  claimReward.tabIndex = claimVisible ? 0 : -1;
  claimReward.setAttribute("aria-hidden", String(!claimVisible));

  if (state.screen === "recommendation") {
    message.innerHTML = `
      <h1>${t("home.greetingTitle", { greeting: t(getGreetingKey(new Date().getHours())) })}</h1>
      <p class="time-label">${t("home.timeAdvice")}</p>
      <p class="supporting">${t("home.recommendation")}</p>
      ${growthCue()}`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `<button class="primary-action" data-action="start">${t("home.startMeditation")}</button>`;
  }

  if (state.screen === "active") {
    message.innerHTML = "";
    if (!timerPanel.querySelector(".timer-ring")) {
      timerPanel.innerHTML = `
        <div class="timer-ring" role="timer">
          <svg class="timer-art" viewBox="0 0 156 156" aria-hidden="true">
            <defs>
              <linearGradient id="timerProgressGradient" x1="78" y1="17" x2="78" y2="139" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#FFE98A"></stop>
                <stop offset="1" stop-color="#BDEBFA"></stop>
              </linearGradient>
            </defs>
            <circle class="timer-track" cx="78" cy="78" r="50" pathLength="100" stroke-dasharray="2 3"></circle>
            <circle class="timer-progress" cx="78" cy="78" r="61" pathLength="100"></circle>
          </svg>
          <span class="timer-dot-orbit" aria-hidden="true"><i class="timer-dot"></i></span>
          <span class="timer-copy">
            <time>${formatTime(state.secondsRemaining)}</time>
            <small>${t("timer.remaining")}</small>
          </span>
        </div>
        <p></p>`;
    }
    const timerRing = timerPanel.querySelector(".timer-ring");
    const timerTime = timerPanel.querySelector("time");
    const timerPrompt = timerPanel.querySelector("p");
    timerRing.setAttribute("aria-label", t("timer.remainingAria", { time: formatTime(state.secondsRemaining) }));
    timerTime.textContent = formatTime(state.secondsRemaining);
    timerPrompt.textContent = state.isPaused ? t("timer.pausedPrompt") : t("timer.breathPrompt");
    if (state.secondsRemaining === 0 && !countdownCompleteTimer) {
      countdownCompleteTimer = window.setTimeout(() => {
        dispatch({ type: "COUNTDOWN_COMPLETE" });
      }, reducedMotion.matches ? 1 : 300);
    }
    actionZone.innerHTML = `
      <div class="session-controls" role="group" aria-label="${t("timer.controlsAria")}">
        <button class="session-control session-control-primary" data-action="pause" aria-label="${state.isPaused ? t("timer.resumeAria") : t("timer.pauseAria")}" aria-pressed="${state.isPaused}">
          <img src="./assets/${state.isPaused ? "play" : "pause"}.svg" alt="" aria-hidden="true" />
        </button>
        <button class="session-control session-control-secondary" data-action="end" aria-label="${t("timer.endAria")}">
          <img src="./assets/stop.svg" alt="" aria-hidden="true" />
        </button>
      </div>`;
  }

  if (state.screen === "completion") {
    message.innerHTML = "";
    timerPanel.innerHTML = "";
    actionZone.innerHTML = "";
  }

  if (state.screen === "reward") {
    message.innerHTML = `
      <p class="time-label">${t("reward.newObject")}</p>
      <h1>${t("reward.unlockedTitle")}</h1>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = "";
  }

  if (state.screen === "reward-settled") {
    message.innerHTML = `
      <p class="time-label">${t("reward.claimedEyebrow")}</p>
      <h1>${t("reward.claimedTitle")}</h1>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = "";
  }

  if (state.screen === "meal-prep" || state.screen === "demo-time-shift") {
    message.innerHTML = `
      <p class="time-label">
        <span class="demo-clock" aria-label="${state.screen === "demo-time-shift" ? "17:30" : "15:31"}">
          <span class="demo-clock-track" aria-hidden="true"><b>15:31</b><b>17:30</b></span>
        </span>
        · ${t("meal.completed")}
      </p>
      <h1>${t("meal.prepTitle")}</h1>
      <p class="supporting">${t("meal.prepCopy")}</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <button class="glass-action" data-action="meal-reminder" ${state.screen === "demo-time-shift" ? "disabled" : ""}>
        <img class="action-icon" src="./assets/icon-bell.svg" alt="" />
        <span>${t(state.screen === "demo-time-shift" ? "meal.reminderSet" : "meal.remindMe")}</span>
      </button>`;
  }

  if (state.screen === "meal-time") {
    message.innerHTML = `
      <p class="time-label">${t("meal.timeAdvice")}</p>
      <h1>${t("meal.readyTitle")}</h1>
      <p class="supporting">${t("meal.readyCopy")}</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <button class="glass-action" data-action="start-meal">
        <img class="action-icon" src="./assets/icon-utensils.svg" alt="" />
        <span>${t("meal.start")}</span>
      </button>`;
  }

  renderSchedule();
  setTimerRunning();

  const fromScreen = previousScreen;
  if (screenChanged) {
    previousScreen = state.screen;
    scheduleScreenEntry(fromScreen);
  }
  playCurrentScene({ fromScreen });
  if (screenChanged) {
    syncPreloadSource(scenePreloader, getNextMediaSource(state.screen));
  }

  window.setTimeout(() => app.classList.remove("is-changing"), 620);
}

function dispatch(event) {
  const nextState = transition(state, event);
  if (nextState === state) return;
  state = nextState;
  render();
}

function finishWelcome() {
  if (welcomeOverlay.hidden) return;
  window.clearTimeout(welcomeTimer);
  window.clearTimeout(welcomeHapticTimer);
  welcomeOverlay.classList.add("is-leaving");
  app.classList.remove("is-welcoming");
  welcomeTimer = window.setTimeout(() => {
    welcomeOverlay.hidden = true;
    welcomeOverlay.classList.remove("is-playing", "is-leaving");
  }, 220);
}

function setupDailyWelcome() {
  if (state.screen !== "recommendation") return;
  const currentKey = getLocalDateKey();
  const play = shouldPlayDailyWelcome({
    lastSeenKey: readStorage(WELCOME_KEY),
    currentKey,
    reducedMotion: reducedMotion.matches,
  });
  if (!play) return;

  writeStorage(WELCOME_KEY, currentKey);
  welcomeGreeting.textContent = t(getGreetingKey(new Date().getHours()));
  welcomeOverlay.hidden = false;
  app.classList.add("is-welcoming");
  window.requestAnimationFrame(() => welcomeOverlay.classList.add("is-playing"));
  welcomeHapticTimer = window.setTimeout(() => {
    if (canPlayAutomaticHaptic(navigator.userActivation)) navigator.vibrate?.(10);
  }, 680);
  welcomeTimer = window.setTimeout(finishWelcome, 2050);
}

function showToast(key) {
  window.clearTimeout(toastTimer);
  toast.textContent = t(key);
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function resetExperience(eventType = "RESET") {
  clearScreenTimers();
  removeStorage(CLAIM_KEY);
  removeStorage(TENT_SEEN_KEY);
  app.classList.remove(
    "has-tent",
    "is-tent-new",
    "is-reward-entered",
    "is-claiming",
    "is-time-shifting",
    "is-media-veiled",
  );
  state = transition(state, { type: eventType });
  render();
}

function setActiveNavigation(nav) {
  const items = [...bottomNav.querySelectorAll(".nav-item")];
  const activeIndex = items.findIndex((item) => item.dataset.nav === nav);
  if (activeIndex >= 0) {
    bottomNav.style.setProperty("--nav-indicator-x", `${activeIndex * 100}%`);
  }

  items.forEach((item) => {
    const active = item.dataset.nav === nav;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

welcomeOverlay.addEventListener("click", finishWelcome);
document.addEventListener("keydown", (event) => {
  if (!welcomeOverlay.hidden && event.key === "Escape") finishWelcome();
});

app.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  if (action === "start") dispatch({ type: "START" });
  if (action === "pause") dispatch({ type: "TOGGLE_PAUSE" });
  if (action === "end") dispatch({ type: "END" });
  if (action === "claim-reward") {
    if (state.screen !== "reward" || claimReward.classList.contains("is-claiming")) return;
    claimReward.classList.add("is-claiming");
    navigator.vibrate?.(10);
    claimDispatchTimer = window.setTimeout(() => {
      writeStorage(CLAIM_KEY, "claimed");
      app.classList.add("has-tent");
      dispatch({ type: "CLAIM_REWARD" });
    }, reducedMotion.matches ? 1 : 360);
  }
  if (action === "collect-growth") collectGrowthReward(button);
  if (action === "nav-tap") {
    const nav = button.dataset.nav;
    if (nav === "trainer") {
      finishWelcome();
      trainerBooking.show();
      setActiveNavigation("trainer");
    } else if (nav === "coach") {
      trainerBooking.hide();
      setActiveNavigation("coach");
    } else {
      showToast("toast.comingSoon");
    }
  }
  if (action === "meal-reminder") dispatch({ type: "SET_MEAL_REMINDER" });
  if (action === "start-meal") resetExperience("START_MEAL");
  if (action === "reset") resetExperience();
  if (action === "object-detail") {
    writeStorage(TENT_SEEN_KEY, "true");
    app.classList.remove("is-tent-new");
    objectDialog.showModal();
  }
  if (action === "close-detail") objectDialog.close();
});

render(false);
renderGrowthStats();
renderGrowthBubbles();
setupDailyWelcome();
