export function createInitialState({ resumeClaim = false } = {}) {
  return {
    screen: resumeClaim ? "reward" : "recommendation",
    secondsRemaining: resumeClaim ? 0 : 300,
    isPaused: false,
    mood: null,
    claimMode: resumeClaim ? "resume" : null,
  };
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function startReward(state) {
  return {
    ...state,
    screen: "reward",
    secondsRemaining: 0,
    isPaused: false,
    claimMode: "full",
  };
}

export function transition(state, event) {
  switch (event.type) {
    case "START":
      if (state.screen !== "recommendation") return state;
      return { ...state, screen: "active", isPaused: false };
    case "TOGGLE_PAUSE":
      if (state.screen !== "active") return state;
      return { ...state, isPaused: !state.isPaused };
    case "TICK":
      if (state.screen !== "active" || state.isPaused) return state;
      if (state.secondsRemaining <= 1) return startReward(state);
      return { ...state, secondsRemaining: state.secondsRemaining - 1 };
    case "END":
      if (state.screen !== "active") return state;
      return startReward(state);
    case "CLAIM_COMPLETE":
      if (state.screen !== "reward") return state;
      return {
        ...state,
        screen: state.claimMode === "resume" ? "next-task" : "reflection",
        claimMode: null,
      };
    case "SELECT_MOOD":
      if (state.screen !== "reflection") return state;
      return { ...state, screen: "feedback-confirmed", mood: event.mood };
    case "FEEDBACK_COMPLETE":
      if (state.screen !== "feedback-confirmed") return state;
      return { ...state, screen: "next-task" };
    case "SKIP_FEEDBACK":
      if (state.screen !== "reflection") return state;
      return { ...state, screen: "next-task" };
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}
