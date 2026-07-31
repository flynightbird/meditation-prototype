const BASE_SCHEDULE = [
  { id: "water-am", time: "08:00", label: "补充水分", icon: "water" },
  { id: "meal", time: "12:00", label: "营养午餐", icon: "meal" },
  { id: "meditation", time: "15:30", label: "冥想", icon: "meditation" },
  { id: "fitness", time: "17:30", label: "力量训练", icon: "fitness" },
  { id: "water-pm", time: "18:30", label: "补充水分", icon: "water" },
  { id: "stretch", time: "22:30", label: "睡前拉伸", icon: "fitness" },
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

export function buildSchedule(screen) {
  const afterMeditation = ["next-task", "feedback-confirmed"].includes(screen);
  return BASE_SCHEDULE.map((task, index) => {
    let status = "upcoming";
    if (afterMeditation) {
      if (index <= 2) status = "done";
      if (task.id === "fitness") status = "current";
    } else {
      if (index <= 1) status = "done";
      if (task.id === "meditation") status = "current";
    }
    return { ...task, status };
  });
}
