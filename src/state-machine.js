export function createInitialState() {
  return {
    screen: "recommendation",
    secondsRemaining: 20,
    isPaused: false,
  };
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function startCompletion(state) {
  return { ...state, screen: "completion", secondsRemaining: 0, isPaused: false };
}

export function transition(state, event) {
  switch (event.type) {
    case "START":
      return state.screen === "recommendation"
        ? { ...state, screen: "active", isPaused: false }
        : state;
    case "TOGGLE_PAUSE":
      return state.screen === "active"
        ? { ...state, isPaused: !state.isPaused }
        : state;
    case "TICK":
      if (state.screen !== "active" || state.isPaused) return state;
      return state.secondsRemaining <= 0
        ? state
        : { ...state, secondsRemaining: state.secondsRemaining - 1 };
    case "COUNTDOWN_COMPLETE":
      return state.screen === "active" && state.secondsRemaining === 0
        ? startCompletion(state)
        : state;
    case "END":
      return state.screen === "active" ? startCompletion(state) : state;
    case "COMPLETION_VIDEO_ENDED":
      return state.screen === "completion" ? { ...state, screen: "reward" } : state;
    case "CLAIM_REWARD":
      return state.screen === "reward" ? { ...state, screen: "reward-settled" } : state;
    case "REWARD_SETTLE_COMPLETE":
      return state.screen === "reward-settled" ? { ...state, screen: "meal-prep" } : state;
    case "SET_MEAL_REMINDER":
      return state.screen === "meal-prep" ? { ...state, screen: "demo-time-shift" } : state;
    case "DEMO_TIME_REACHED":
      return state.screen === "demo-time-shift" ? { ...state, screen: "meal-time" } : state;
    case "START_MEAL":
      return state.screen === "meal-time" ? createInitialState() : state;
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}
