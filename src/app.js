import { buildSchedule, getGreeting, getLocalDateKey, shouldPlayDailyWelcome } from "./experience.js";
import {
  getMediaScene,
  getReplayTime,
  shouldReplaySegment,
  shouldRunMediaTimer,
} from "./media-scene.js";
import { createInitialState, formatTime, transition } from "./state-machine.js";
import {
  addTaskReward,
  collectBubble,
  createGrowthState,
  getDailyProgress,
  getVisibleBubbles,
  normalizeGrowthState,
} from "./growth.js";

const WELCOME_KEY = "growth-base.welcome-date";
const CLAIM_KEY = "growth-base.tent-claim";
const TENT_SEEN_KEY = "growth-base.tent-seen";
const GROWTH_KEY = "growth-base.growth-state";

const ATTRIBUTE_LABELS = {
  stamina: "体力",
  focus: "专注",
  vitality: "活力",
};

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
const claimReward = document.querySelector("#claimReward");
const rewardLayer = document.querySelector("#rewardLayer");
const growthBubbleLayer = document.querySelector("#growthBubbleLayer");

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
    .map((bubble, index) => `
      <button
        class="growth-bubble bubble-${bubble.attribute} anchor-${index + 1}"
        type="button"
        data-action="collect-growth"
        data-reward-ids="${bubble.rewardIds.join(",")}"
        aria-label="领取${ATTRIBUTE_LABELS[bubble.attribute]} ${bubble.value}"
        style="--bubble-index:${index}"
      >
        <small>${ATTRIBUTE_LABELS[bubble.attribute]}</small>
        <strong>+${bubble.value}</strong>
      </button>`)
    .join("");
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

function commitGrowthCollection(button, rewardIds) {
  const nextState = collectBubble(growthState, rewardIds);
  if (nextState !== growthState && writeGrowthState(nextState)) {
    growthState = nextState;
    renderGrowthBubbles();
    return;
  }
  button.classList.remove("is-collecting");
  button.disabled = false;
}

function collectGrowthReward(button) {
  if (button.classList.contains("is-collecting")) return;
  const rewardIds = button.dataset.rewardIds.split(",").filter(Boolean);
  button.classList.add("is-collecting");
  button.disabled = true;
  if (reducedMotion.matches) {
    commitGrowthCollection(button, rewardIds);
    return;
  }
  button.addEventListener("animationend", (event) => {
    if (event.animationName === "collect-growth-bubble") {
      commitGrowthCollection(button, rewardIds);
    }
  }, { once: true });
}

function taskCard({ id, time, label, icon, reward, status }) {
  const current = status === "current";
  const done = status === "done";
  return `
    <article class="task-card is-${status}" data-task-id="${id}" data-task-icon="${icon}" ${current ? 'aria-current="step"' : ""} aria-label="${time} ${label}，${reward.label}加${reward.value}${done ? "，已完成" : current ? "，当前任务" : ""}">
      ${current ? '<span class="current-label">当前</span>' : ""}
      ${done ? '<svg class="check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z"></path></svg>' : ""}
      <span class="task-visual"><img src="${assets[icon]}" alt="" /></span>
      <span class="task-copy">
        <time>${time}</time>
        <span class="task-details">
          <strong>${label}</strong>
          <span class="task-reward reward-${reward.attribute}" aria-hidden="true"><small>${reward.label}</small><b>+${reward.value}</b></span>
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
  const status = progress === 4 ? "帐篷营地已获得" : "完成可获得帐篷营地";
  return `<p class="growth-cue">今日任务 ${progress}/4，${status}</p>`;
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

function stopMedia() {
  sceneVideo.pause();
  sceneVideo.removeAttribute("src");
  sceneVideo.load();
  app.classList.remove("has-media", "is-media-veiled", "is-time-shifting");
}

function playCurrentScene({ fromScreen = null } = {}) {
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

function scheduleScreenEntry(fromScreen) {
  clearScreenTimers();

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
    showToast("提醒已设置");
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
      <h1>${getGreeting(new Date().getHours())}，Maggie</h1>
      <p class="time-label">15:30 · AI健康建议</p>
      <p class="supporting">你通常在下午3点后注意力下降，今天安排5分钟放松吧。</p>
      ${growthCue()}`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = '<button class="primary-action" data-action="start">开始冥想</button>';
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
            <small>剩余时间</small>
          </span>
        </div>
        <p></p>`;
    }
    const timerRing = timerPanel.querySelector(".timer-ring");
    const timerTime = timerPanel.querySelector("time");
    const timerPrompt = timerPanel.querySelector("p");
    timerRing.setAttribute("aria-label", `剩余时间${formatTime(state.secondsRemaining)}`);
    timerTime.textContent = formatTime(state.secondsRemaining);
    timerPrompt.textContent = state.isPaused ? "已暂停，准备好再继续" : "缓慢吸气，再慢慢呼出";
    if (state.secondsRemaining === 0 && !countdownCompleteTimer) {
      countdownCompleteTimer = window.setTimeout(() => {
        dispatch({ type: "COUNTDOWN_COMPLETE" });
      }, reducedMotion.matches ? 1 : 300);
    }
    actionZone.innerHTML = `
      <div class="session-controls" role="group" aria-label="冥想控制">
        <button data-action="pause" aria-pressed="${state.isPaused}">${state.isPaused ? "继续" : "暂停"}</button>
        <button data-action="end">结束</button>
      </div>`;
  }

  if (state.screen === "completion") {
    message.innerHTML = "";
    timerPanel.innerHTML = "";
    actionZone.innerHTML = "";
  }

  if (state.screen === "reward") {
    message.innerHTML = `
      <p class="time-label">静心营地 · 新物件</p>
      <h1>静心帐篷已解锁</h1>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = "";
  }

  if (state.screen === "reward-settled") {
    message.innerHTML = `
      <p class="time-label">领取成功</p>
      <h1>静心帐篷已放入营地</h1>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = "";
  }

  if (state.screen === "meal-prep" || state.screen === "demo-time-shift") {
    message.innerHTML = `
      <p class="time-label">
        <span class="demo-clock" aria-label="${state.screen === "demo-time-shift" ? "17:30" : "15:31"}">
          <span class="demo-clock-track" aria-hidden="true"><b>15:31</b><b>17:30</b></span>
        </span>
        · 静心练习已完成
      </p>
      <h1>晚餐正在准备中</h1>
      <p class="supporting">17:30 回来看看，今晚吃得轻松一点。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <button class="glass-action" data-action="meal-reminder" ${state.screen === "demo-time-shift" ? "disabled" : ""}>
        <img class="action-icon" src="./assets/icon-bell.svg" alt="" />
        <span>${state.screen === "demo-time-shift" ? "提醒已设置" : "17:30 提醒我"}</span>
      </button>`;
  }

  if (state.screen === "meal-time") {
    message.innerHTML = `
      <p class="time-label">17:30 · 今日健康建议</p>
      <h1>晚餐时间到了</h1>
      <p class="supporting">好好吃饭，也是今天恢复计划的一部分。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <button class="glass-action" data-action="start-meal">
        <img class="action-icon" src="./assets/icon-utensils.svg" alt="" />
        <span>我开动了</span>
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
  welcomeGreeting.textContent = getGreeting(new Date().getHours());
  welcomeOverlay.hidden = false;
  app.classList.add("is-welcoming");
  window.requestAnimationFrame(() => welcomeOverlay.classList.add("is-playing"));
  welcomeHapticTimer = window.setTimeout(() => navigator.vibrate?.(10), 680);
  welcomeTimer = window.setTimeout(finishWelcome, 2050);
}

function showToast(text) {
  window.clearTimeout(toastTimer);
  toast.textContent = text;
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
  if (action === "nav-tap" && button.dataset.nav !== "coach") showToast("敬请期待");
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
renderGrowthBubbles();
setupDailyWelcome();
