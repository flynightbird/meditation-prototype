import { buildSchedule, getGreeting, getLocalDateKey, shouldPlayDailyWelcome } from "./experience.js";
import { getMediaScene, getReplayTime, shouldRunMediaTimer } from "./media-scene.js";
import { createInitialState, formatTime, transition } from "./state-machine.js";

const WELCOME_KEY = "growth-base.welcome-date";
const CLAIM_KEY = "growth-base.tent-claim";
const TENT_SEEN_KEY = "growth-base.tent-seen";

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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let state = createInitialState();
let previousScreen = null;
let timerId = null;
let feedbackTimer = null;
let feedbackConfirmTimer = null;
let demoShiftTimer = null;
let mediaVeilTimer = null;
let claimDispatchTimer = null;
let welcomeTimer = null;
let welcomeHapticTimer = null;
let toastTimer = null;
let highFiveHapticFired = false;

const assets = {
  meal: "./assets/task-meal.png",
  meditation: "./assets/task-meditation.png",
  fitness: "./assets/task-fitness.png?v=20260731",
  water: "./assets/task-water.png",
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

function taskCard({ id, time, label, icon, status }) {
  const current = status === "current";
  const done = status === "done";
  return `
    <article class="task-card is-${status}" data-task-id="${id}" data-task-icon="${icon}" ${current ? 'aria-current="step"' : ""} aria-label="${time} ${label}${done ? "，已完成" : current ? "，当前任务" : ""}">
      <time>${time}</time>
      <span class="task-visual"><img src="${assets[icon]}" alt="" /></span>
      <span class="task-footer">
        <strong>${label}</strong>
        ${done ? '<span class="check" aria-hidden="true">✓</span>' : ""}
      </span>
      ${current ? '<span class="current-label">当前</span>' : ""}
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
  const claimed = readStorage(CLAIM_KEY) === "claimed";
  const filled = claimed ? 4 : 3;
  const dots = Array.from(
    { length: 4 },
    (_, index) => `<i class="${index < filled ? "is-filled" : ""}"></i>`,
  ).join("");
  return `
    <div class="growth-cue" aria-label="静心营地进度${filled}分之4">
      <strong>静心营地</strong>
      <span class="growth-dots" aria-hidden="true">${dots}</span>
      <span>${claimed ? "静心帐篷已加入营地" : "再完成1次解锁帐篷"}</span>
    </div>`;
}

function setTimerRunning() {
  window.clearInterval(timerId);
  timerId = null;
  if (
    shouldRunMediaTimer({
      screen: state.screen,
      isPaused: state.isPaused,
      mediaReady:
        sceneVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !sceneVideo.paused,
    })
  ) {
    timerId = window.setInterval(() => {
      state = transition(state, { type: "TICK" });
      render(false);
    }, 1000);
  }
}

function clearScreenTimers() {
  window.clearTimeout(feedbackTimer);
  window.clearTimeout(feedbackConfirmTimer);
  window.clearTimeout(demoShiftTimer);
  window.clearTimeout(mediaVeilTimer);
  window.clearTimeout(claimDispatchTimer);
  feedbackTimer = null;
  feedbackConfirmTimer = null;
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
    if (state.screen === "recommendation") {
      const preloadSource = getMediaScene("active").src;
      sceneVideo.pause();
      if (sceneVideo.getAttribute("src") !== preloadSource) {
        sceneVideo.src = preloadSource;
        sceneVideo.load();
      }
      app.classList.remove("has-media", "is-media-veiled", "is-time-shifting");
      return;
    }
    stopMedia();
    return;
  }

  const sourceChanged = sceneVideo.getAttribute("src") !== scene.src;
  app.classList.remove("media-failed");
  if (sourceChanged) {
    sceneVideo.pause();
    sceneVideo.src = scene.src;
    sceneVideo.load();
  }

  app.classList.add("has-media");

  const startPlayback = () => {
    if (state.screen === "reward") {
      sceneVideo.currentTime = getReplayTime("reward", sceneVideo.duration);
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
  if (
    state.screen === "completion" &&
    !highFiveHapticFired &&
    sceneVideo.currentTime >= 6.7
  ) {
    highFiveHapticFired = true;
    navigator.vibrate?.(12);
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

  if (state.screen !== "reward") {
    app.classList.remove("is-reward-entered", "is-claiming");
  }

  if (state.screen === "completion") {
    highFiveHapticFired = false;
  }

  if (state.screen === "reward") {
    app.classList.remove("is-reward-entered", "is-claiming");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => app.classList.add("is-reward-entered"));
    });
  }

  if (state.screen === "reflection") {
    feedbackTimer = window.setTimeout(() => {
      dispatch({ type: "SKIP_FEEDBACK" });
    }, 5000);
  }

  if (state.screen === "feedback-confirmed") {
    feedbackConfirmTimer = window.setTimeout(() => {
      dispatch({ type: "FEEDBACK_COMPLETE" });
    }, 650);
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

  const focused = ["active", "completion", "reward", "reflection", "feedback-confirmed"].includes(state.screen);
  const claimStatus = readStorage(CLAIM_KEY);
  const hasTent = claimStatus === "claimed" && state.screen !== "reward";
  const canInspectTent = hasTent && !getMediaScene(state.screen);
  const tentIsNew = canInspectTent && readStorage(TENT_SEEN_KEY) !== "true";
  const claimVisible = state.screen === "reward";

  app.classList.toggle("has-tent", canInspectTent);
  app.classList.toggle("is-tent-new", tentIsNew);
  taskRail.setAttribute("aria-hidden", String(focused));
  bottomNav.setAttribute("aria-hidden", String(focused));
  rewardObject.setAttribute("aria-hidden", String(!canInspectTent));
  rewardObject.tabIndex = canInspectTent ? 0 : -1;
  claimReward.hidden = !claimVisible;
  claimReward.tabIndex = claimVisible ? 0 : -1;
  claimReward.setAttribute("aria-hidden", String(!claimVisible));

  if (state.screen === "recommendation") {
    message.innerHTML = `
      <h1>今天恢复得不错</h1>
      <p class="time-label">15:30 · AI健康建议</p>
      <p class="supporting">你通常在下午3点后注意力下降，今天安排5分钟放松吧。</p>
      ${growthCue()}`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = '<button class="primary-action" data-action="start">开始冥想</button>';
  }

  if (state.screen === "active") {
    message.innerHTML = "";
    const progress = (state.secondsRemaining / 20) * 100;
    timerPanel.style.setProperty("--progress", `${progress}%`);
    timerPanel.innerHTML = `
      <div class="timer-ring">
        <span>静心练习</span>
        <time>${formatTime(state.secondsRemaining)}</time>
        <small>剩余时间</small>
      </div>
      <p>${state.isPaused ? "已暂停，准备好再继续" : "缓慢吸气，再慢慢呼出"}</p>`;
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

  if (state.screen === "reflection") {
    message.innerHTML = `
      <p class="time-label">静心帐篷已放入营地</p>
      <h1>这次感觉如何？</h1>
      <p class="supporting">你的回答会用于调整下一次冥想时长和推荐时间。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <div class="mood-actions" role="group" aria-label="选择现在的感受">
        <button data-action="mood" data-mood="lighter">轻松一些</button>
        <button data-action="mood" data-mood="same">差不多</button>
        <button data-action="mood" data-mood="tense">没进入状态</button>
      </div>`;
  }

  if (state.screen === "feedback-confirmed") {
    message.innerHTML = `
      <p class="time-label">反馈已记录</p>
      <h1>下次建议会更贴合你</h1>
      <p class="supporting">我会结合这次感受，调整下一次建议。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = '<div class="feedback-saved" role="status"><span>✓</span> 已用于调整下次建议</div>';
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
  if (action === "mood") dispatch({ type: "SELECT_MOOD", mood: button.dataset.mood });
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
setupDailyWelcome();
