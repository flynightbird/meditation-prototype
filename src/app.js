import { buildSchedule, getGreeting, getLocalDateKey, shouldPlayDailyWelcome } from "./experience.js";
import { createInitialState, formatTime, transition } from "./state-machine.js";

const WELCOME_KEY = "growth-base.welcome-date";
const CLAIM_KEY = "growth-base.tent-claim";
const TENT_SEEN_KEY = "growth-base.tent-seen";

const app = document.querySelector("#app");
const message = document.querySelector("#message");
const timerPanel = document.querySelector("#timerPanel");
const character = document.querySelector("#character");
const actionZone = document.querySelector("#actionZone");
const taskRail = document.querySelector("#taskRail");
const bottomNav = document.querySelector(".bottom-nav");
const toast = document.querySelector("#toast");
const rewardObject = document.querySelector("#rewardObject");
const objectDialog = document.querySelector("#objectDialog");
const welcomeOverlay = document.querySelector("#welcomeOverlay");
const welcomeGreeting = document.querySelector("#welcomeGreeting");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const initialClaimStatus = readStorage(CLAIM_KEY);
let state = createInitialState({ resumeClaim: initialClaimStatus === "claiming" });
let previousScreen = null;
let timerId = null;
let claimLandTimer = null;
let claimCompleteTimer = null;
let feedbackTimer = null;
let feedbackConfirmTimer = null;
let welcomeTimer = null;
let welcomeHapticTimer = null;
let toastTimer = null;

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
    // The prototype still works when storage is unavailable.
  }
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // The prototype still works when storage is unavailable.
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
  const scheduleScreen = state.screen === "next-task" ? "next-task" : "recommendation";
  taskRail.innerHTML = buildSchedule(scheduleScreen).map(taskCard).join("");
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
  if (state.screen === "active" && !state.isPaused) {
    timerId = window.setInterval(() => {
      state = transition(state, { type: "TICK" });
      render(false);
    }, 1000);
  }
}

function clearScreenTimers() {
  window.clearTimeout(claimLandTimer);
  window.clearTimeout(claimCompleteTimer);
  window.clearTimeout(feedbackTimer);
  window.clearTimeout(feedbackConfirmTimer);
  claimLandTimer = null;
  claimCompleteTimer = null;
  feedbackTimer = null;
  feedbackConfirmTimer = null;
}

function scheduleScreenEntry() {
  clearScreenTimers();

  if (state.screen === "reward") {
    const resumed = state.claimMode === "resume";
    const landDelay = reducedMotion.matches ? 20 : resumed ? 60 : 620;
    const completeDelay = reducedMotion.matches ? 460 : resumed ? 650 : 2100;
    writeStorage(CLAIM_KEY, "claiming");
    app.classList.remove("is-claim-landed");
    app.classList.toggle("is-resume-claim", resumed);

    claimLandTimer = window.setTimeout(() => {
      app.classList.add("is-claim-landed");
      if (!resumed && !reducedMotion.matches) navigator.vibrate?.(10);
    }, landDelay);

    claimCompleteTimer = window.setTimeout(() => {
      writeStorage(CLAIM_KEY, "claimed");
      app.classList.add("has-tent");
      dispatch({ type: "CLAIM_COMPLETE" });
    }, completeDelay);
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

  if (state.screen === "recommendation" || state.screen === "next-task") {
    centerCurrentTask(previousScreen === null ? "auto" : "smooth");
  }
}

function render(animate = true) {
  const screenChanged = previousScreen !== state.screen;
  app.dataset.screen = state.screen;
  app.classList.toggle("is-paused", state.isPaused);
  app.classList.toggle("is-changing", animate && screenChanged);

  const focused = ["active", "reward", "reflection", "feedback-confirmed"].includes(state.screen);
  const claimStatus = readStorage(CLAIM_KEY);
  const hasTent = claimStatus === "claimed" || state.screen === "reward" || state.screen === "reflection" || state.screen === "feedback-confirmed" || state.screen === "next-task";
  const canInspectTent = claimStatus === "claimed" && state.screen !== "reward";
  const tentIsNew = canInspectTent && readStorage(TENT_SEEN_KEY) !== "true";

  app.classList.toggle("has-tent", hasTent);
  app.classList.toggle("is-tent-new", tentIsNew);
  taskRail.setAttribute("aria-hidden", String(focused));
  bottomNav.setAttribute("aria-hidden", String(focused));
  rewardObject.setAttribute("aria-hidden", String(!canInspectTent));
  rewardObject.tabIndex = canInspectTent ? 0 : -1;

  if (state.screen === "recommendation") {
    character.src = "./assets/ip-meditate.png";
    message.innerHTML = `
      <h1>今天恢复得不错</h1>
      <p class="time-label">15:30 · AI健康建议</p>
      <p class="supporting">你通常在下午3点后注意力下降，今天安排5分钟放松吧。</p>
      ${growthCue()}`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = '<button class="primary-action" data-action="start">开始冥想</button>';
  }

  if (state.screen === "active") {
    character.src = "./assets/ip-stretch.png";
    message.innerHTML = "";
    const progress = (state.secondsRemaining / 300) * 100;
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

  if (state.screen === "reward") {
    character.src = "./assets/ip-meditate.png";
    message.innerHTML = `
      <p class="time-label">静心营地 · 4/4</p>
      <h1>静心帐篷<br />正在加入营地</h1>
      <p class="supporting">由你本周完成的4次静心练习共同搭建。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <div class="reward-copy" role="status">
        <span>${state.claimMode === "resume" ? "正在补完领取" : "自动领取中"}</span>
        <strong>静心帐篷</strong>
      </div>`;
  }

  if (state.screen === "reflection") {
    character.src = "./assets/ip-meditate.png";
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
    character.src = "./assets/ip-meditate.png";
    message.innerHTML = `
      <p class="time-label">反馈已记录</p>
      <h1>下次建议会更贴合你</h1>
      <p class="supporting">我会结合这次感受，调整下一次建议。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = '<div class="feedback-saved" role="status"><span>✓</span> 已用于调整下次建议</div>';
  }

  if (state.screen === "next-task") {
    character.src = "./assets/ip-walk.png";
    message.innerHTML = `
      <p class="time-label">静心营地 · 第二阶段已开启</p>
      <h1>下一站，17:30<br />力量训练</h1>
      <p class="supporting">距离训练还有一段时间，先去忙吧，到点我会回来提醒你。</p>`;
    timerPanel.innerHTML = "";
    actionZone.innerHTML = `
      <button class="primary-action" data-action="remind">17:30 提醒我</button>
      <button class="text-action" data-action="reset">重播体验</button>`;
  }

  renderSchedule();
  window.setTimeout(() => app.classList.remove("is-changing"), 620);
  setTimerRunning();

  if (screenChanged) {
    previousScreen = state.screen;
    scheduleScreenEntry();
  }
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

function resetExperience() {
  clearScreenTimers();
  removeStorage(CLAIM_KEY);
  removeStorage(TENT_SEEN_KEY);
  app.classList.remove("has-tent", "is-tent-new", "is-claim-landed", "is-resume-claim");
  state = transition(state, { type: "RESET" });
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
  if (action === "reset") resetExperience();
  if (action === "object-detail") {
    writeStorage(TENT_SEEN_KEY, "true");
    app.classList.remove("is-tent-new");
    objectDialog.showModal();
  }
  if (action === "close-detail") objectDialog.close();
  if (action === "remind") {
    button.textContent = "已设置 17:30 提醒";
    button.disabled = true;
    showToast("提醒已设置");
  }
});

render(false);
setupDailyWelcome();
