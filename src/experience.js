const BASE_SCHEDULE = [
  { id: "water-am", time: "08:00", label: "补充水分", icon: "water", reward: { attribute: "vitality", label: "活力", value: 10 } },
  { id: "lunch", time: "12:00", label: "营养午餐", icon: "meal", reward: { attribute: "stamina", label: "体力", value: 10 } },
  { id: "meditation", time: "15:30", label: "冥想", icon: "meditation", reward: { attribute: "focus", label: "专注", value: 10 } },
  { id: "dinner", time: "17:30", label: "健康晚餐", icon: "meal", reward: { attribute: "stamina", label: "体力", value: 10 } },
  { id: "water-pm", time: "18:30", label: "补充水分", icon: "water", reward: { attribute: "vitality", label: "活力", value: 10 } },
  { id: "fitness", time: "19:00", label: "力量训练", icon: "fitness", reward: { attribute: "vitality", label: "活力", value: 10 } },
  { id: "stretch", time: "22:30", label: "睡前拉伸", icon: "fitness", reward: { attribute: "vitality", label: "活力", value: 10 } },
];

export function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  if (hour >= 18) return "晚上好";
  return "这么晚还没休息吗";
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
