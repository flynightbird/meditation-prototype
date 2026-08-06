const BASE_SCHEDULE = [
  { id: "water-am", time: "08:00", labelKey: "task.water", icon: "water", reward: { attribute: "vitality", labelKey: "growth.vitality", value: 10 } },
  { id: "lunch", time: "12:00", labelKey: "task.lunch", icon: "meal", reward: { attribute: "stamina", labelKey: "growth.stamina", value: 10 } },
  { id: "meditation", time: "15:30", labelKey: "task.meditation", icon: "meditation", reward: { attribute: "focus", labelKey: "growth.focus", value: 10 } },
  { id: "dinner", time: "17:30", labelKey: "task.dinner", icon: "meal", reward: { attribute: "stamina", labelKey: "growth.stamina", value: 10 } },
  { id: "water-pm", time: "18:30", labelKey: "task.water", icon: "water", reward: { attribute: "vitality", labelKey: "growth.vitality", value: 10 } },
  { id: "fitness", time: "19:00", labelKey: "task.fitness", icon: "fitness", reward: { attribute: "vitality", labelKey: "growth.vitality", value: 10 } },
  { id: "stretch", time: "22:30", labelKey: "task.stretch", icon: "fitness", reward: { attribute: "vitality", labelKey: "growth.vitality", value: 10 } },
];

export function getGreetingKey(hour) {
  if (hour >= 5 && hour < 12) return "greeting.morning";
  if (hour >= 12 && hour < 18) return "greeting.afternoon";
  if (hour >= 18) return "greeting.evening";
  return "greeting.lateNight";
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shouldPlayDailyWelcome({
  lastSeenKey,
  currentKey,
  reducedMotion,
}) {
  return !reducedMotion && lastSeenKey !== currentKey;
}

export function canPlayAutomaticHaptic(userActivation) {
  return userActivation?.hasBeenActive === true;
}

export function buildSchedule(screen) {
  const dinnerCurrent = ["reward-settled", "meal-prep", "demo-time-shift", "meal-time"].includes(screen);
  return BASE_SCHEDULE.map((task, index) => {
    let status = "upcoming";
    if (dinnerCurrent) {
      if (index <= 2) status = "done";
      if (task.id === "dinner") status = "current";
    } else {
      if (index <= 1) status = "done";
      if (task.id === "meditation") status = "current";
    }
    return { ...task, status };
  });
}
