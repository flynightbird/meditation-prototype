export const TRANSLATIONS = {
  "zh-CN": {
    "task.reward": "{label} +{value}",
    "test.chineseFallback": "中文回退",
    "test.missingEverywhere": "",
  },
  en: {
    "task.reward": "{label} +{value}",
    "test.chineseFallback": "",
    "test.missingEverywhere": "",
  },
};

export function normalizeLocale(value) {
  if (typeof value !== "string") return null;
  if (/^zh(?:-|$)/i.test(value)) return "zh-CN";
  if (/^en(?:-|$)/i.test(value)) return "en";
  return null;
}

export function resolveLocale({ search = "", languages = [] } = {}) {
  const requested = new URLSearchParams(search).get("lang");
  if (requested !== null) return normalizeLocale(requested) ?? "zh-CN";
  for (const language of languages) {
    const normalized = normalizeLocale(language);
    if (normalized) return normalized;
  }
  return "zh-CN";
}

function interpolate(template, params) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) =>
    params[name] === undefined || params[name] === null ? "" : String(params[name]),
  );
}

function developmentWarn(message) {
  const hostname = globalThis.location?.hostname;
  if (hostname === undefined || hostname === "localhost" || hostname === "127.0.0.1") {
    console.warn(message);
  }
}

export function createTranslator(localeValue, { warn = developmentWarn } = {}) {
  const activeLocale = normalizeLocale(localeValue) ?? "zh-CN";
  return {
    locale: activeLocale,
    t(key, params = {}) {
      let value = TRANSLATIONS[activeLocale][key];
      if (!value && activeLocale !== "zh-CN") {
        warn(`Missing ${activeLocale} translation: ${key}`);
        value = TRANSLATIONS["zh-CN"][key];
      }
      if (!value) {
        warn(`Missing translation: ${key}`);
        return "";
      }
      return interpolate(value, params);
    },
  };
}

function parseLocalDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

export function formatWeekday(dateKey, localeValue) {
  return new Intl.DateTimeFormat(localeValue, { weekday: "short" })
    .format(parseLocalDate(dateKey));
}

export function formatBookingDate(dateKey, localeValue) {
  const date = parseLocalDate(dateKey);
  if (localeValue === "zh-CN") return `${formatWeekday(dateKey, localeValue)} ${date.getDate()}日`;
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

const browserLanguages = globalThis.navigator?.languages ??
  [globalThis.navigator?.language].filter(Boolean);

export const locale = resolveLocale({
  search: globalThis.location?.search ?? "",
  languages: browserLanguages,
});

export const { t } = createTranslator(locale);
