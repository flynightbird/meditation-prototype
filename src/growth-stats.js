const STAT_DEFINITIONS = [
  { attribute: "vitality", labelKey: "growth.vitality", icon: "./assets/growth-vitality.png" },
  { attribute: "focus", labelKey: "growth.focus", icon: "./assets/growth-focus.png" },
  { attribute: "stamina", labelKey: "growth.stamina", icon: "./assets/growth-stamina.png" },
];

export function getGrowthStatItems(totals) {
  return STAT_DEFINITIONS.map((definition) => {
    const total = totals[definition.attribute];
    return { ...definition, total, mode: total === 0 ? "icon" : "value" };
  });
}
