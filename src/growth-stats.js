const STAT_DEFINITIONS = [
  { attribute: "vitality", label: "活力", icon: "./assets/growth-vitality.png" },
  { attribute: "focus", label: "专注", icon: "./assets/growth-focus.png" },
  { attribute: "stamina", label: "体力", icon: "./assets/growth-stamina.png" },
];

export function getGrowthStatItems(totals) {
  return STAT_DEFINITIONS.map((definition) => {
    const total = totals[definition.attribute];
    return { ...definition, total, mode: total === 0 ? "icon" : "value" };
  });
}
