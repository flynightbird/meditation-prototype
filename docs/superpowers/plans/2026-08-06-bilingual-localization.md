# Bilingual Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete Simplified Chinese and English localization, selected by URL override or browser language, without adding a visible switcher or changing the approved interaction design.

**Architecture:** A dependency-free `src/i18n.js` owns locale resolution, flat translation dictionaries, named interpolation, date formatting, and static DOM translation. Business modules keep stable IDs and translation keys; render modules call `t()` at display time so state never persists localized strings.

**Tech Stack:** Vanilla JavaScript ES modules, HTML data attributes, `Intl.DateTimeFormat`, Node.js built-in test runner, browser visual verification.

---

## File Map

- Create `src/i18n.js`: locale resolution, dictionaries, translation, interpolation, date formatting, and static DOM application.
- Create `tests/i18n.test.js`: unit tests for locale selection, fallback, interpolation, date formatting, and key parity.
- Modify `index.html`: annotate static text and attributes with localization keys while retaining Chinese fallback markup.
- Modify `src/experience.js`: replace task and greeting display text with stable translation keys.
- Modify `src/growth-stats.js`: return growth label keys instead of localized labels.
- Modify `src/app.js`: translate all home, meditation, growth, task, toast, reward, and meal strings at render time.
- Modify `src/trainer-booking.js`: keep booking dates and confirmed identity locale-neutral.
- Modify `src/trainer-booking-view.js`: format dates and translate booking states at render time.
- Modify `tests/experience.test.js`: assert translation keys instead of Chinese domain data.
- Modify `tests/growth-stats.test.js`: assert translation keys in growth definitions.
- Modify `tests/trainer-booking.test.js`: assert locale-neutral date and confirmation state.
- Modify `tests/trainer-booking-contract.test.js`: assert localized static trainer markup and dynamic translation calls.
- Modify `tests/visual-contract.test.js`: assert localization initialization and removal of dynamic Chinese hard-coding.

### Task 1: Build The Localization Core

**Files:**
- Create: `src/i18n.js`
- Create: `tests/i18n.test.js`

- [ ] **Step 1: Write failing locale-resolution and translation tests**

Create `tests/i18n.test.js` with these cases:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  TRANSLATIONS,
  createTranslator,
  formatBookingDate,
  formatWeekday,
  normalizeLocale,
  resolveLocale,
} from "../src/i18n.js";

test("normalizes only supported Chinese and English locales", () => {
  assert.equal(normalizeLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeLocale("zh-Hans-SG"), "zh-CN");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("en-GB"), "en");
  assert.equal(normalizeLocale("fr-FR"), null);
  assert.equal(normalizeLocale(null), null);
});

test("resolves URL before browser languages and falls back to Chinese", () => {
  assert.equal(resolveLocale({ search: "?lang=en", languages: ["zh-CN"] }), "en");
  assert.equal(resolveLocale({ search: "?lang=zh-CN", languages: ["en-US"] }), "zh-CN");
  assert.equal(resolveLocale({ search: "", languages: ["ko-KR", "en-GB"] }), "en");
  assert.equal(resolveLocale({ search: "?lang=fr", languages: ["en-US"] }), "zh-CN");
  assert.equal(resolveLocale({ search: "", languages: ["ko-KR"] }), "zh-CN");
});

test("translates named values and falls back without exposing raw keys", () => {
  const warnings = [];
  const english = createTranslator("en", { warn: (message) => warnings.push(message) });
  assert.equal(english.t("task.reward", { label: "Focus", value: 10 }), "Focus +10");
  assert.equal(english.t("test.chineseFallback"), "中文回退");
  assert.equal(english.t("test.missingEverywhere"), "");
  assert.equal(warnings.length, 3);
});

test("formats booking dates and weekdays for both locales", () => {
  assert.equal(formatWeekday("2026-08-11", "zh-CN"), "周二");
  assert.equal(formatWeekday("2026-08-11", "en"), "Tue");
  assert.equal(formatBookingDate("2026-08-11", "zh-CN"), "周二 11日");
  assert.equal(formatBookingDate("2026-08-11", "en"), "Tue, Aug 11");
});

test("keeps Chinese and English dictionary keys in parity", () => {
  assert.deepEqual(
    Object.keys(TRANSLATIONS.en).sort(),
    Object.keys(TRANSLATIONS["zh-CN"]).sort(),
  );
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
node --test tests/i18n.test.js
```

Expected: FAIL because `src/i18n.js` does not exist.

- [ ] **Step 3: Implement the dependency-free localization API**

Create `src/i18n.js` with this public shape and behavior:

```js
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

export function createTranslator(locale, { warn = developmentWarn } = {}) {
  const activeLocale = normalizeLocale(locale) ?? "zh-CN";
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

export function formatWeekday(dateKey, locale) {
  return new Intl.DateTimeFormat(locale, { weekday: "short" })
    .format(parseLocalDate(dateKey));
}

export function formatBookingDate(dateKey, locale) {
  const date = parseLocalDate(dateKey);
  if (locale === "zh-CN") return `${formatWeekday(dateKey, locale)} ${date.getDate()}日`;
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}
```

After the base functions, initialize browser exports without breaking Node tests:

```js
const browserLanguages = globalThis.navigator?.languages ??
  [globalThis.navigator?.language].filter(Boolean);

export const locale = resolveLocale({
  search: globalThis.location?.search ?? "",
  languages: browserLanguages,
});
export const { t } = createTranslator(locale);
```

The temporary test keys remain until Task 5 replaces them with production fallback tests.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
node --test tests/i18n.test.js
```

Expected: all localization core tests PASS.

- [ ] **Step 5: Commit the localization core**

```bash
git add src/i18n.js tests/i18n.test.js
git commit -m "feat: add bilingual localization core"
```

### Task 2: Localize The Static Application Shell

**Files:**
- Modify: `src/i18n.js`
- Modify: `index.html:2-288`
- Modify: `src/app.js:1-60`
- Modify: `tests/visual-contract.test.js`
- Modify: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Add failing static-localization contracts**

Add tests that require localization initialization and declarative mappings:

```js
test("initializes the static document from the resolved locale", () => {
  assert.match(app, /import\s*{[^}]*applyDocumentTranslations[^}]*}\s*from\s*"\.\/i18n\.js"/s);
  assert.match(app, /applyDocumentTranslations\(document\)/);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /data-i18n="meta\.title"/);
  assert.match(html, /data-i18n="nav\.trainer"/);
  assert.match(html, /data-i18n-aria-label="nav\.primaryLabel"/);
  assert.match(html, /data-i18n-alt="trainer\.coachName"/);
});

test("maps every trainer price and identity through locale keys", () => {
  assert.match(html, /data-i18n="trainer\.coachName">李教练/);
  assert.match(html, /data-i18n="trainer\.storeName">中田健身 · 南山旗舰店/);
  assert.match(html, /data-i18n="trainer\.price">¥298/);
});
```

Extend `tests/i18n.test.js` with a small fake DOM check so attribute mapping is behavior-tested rather than source-tested only:

```js
test("applies translated text and attributes to a static document", () => {
  const attributes = new Map([["data-i18n", "nav.trainer"]]);
  const textNode = {
    textContent: "预约私教",
    getAttribute: (name) => attributes.get(name),
    setAttribute: (name, value) => attributes.set(name, value),
  };
  const root = {
    documentElement: { lang: "zh-CN" },
    title: "",
    querySelectorAll: (selector) => selector === "[data-i18n]" ? [textNode] : [],
  };
  applyDocumentTranslations(root, createTranslator("en"));
  assert.equal(root.documentElement.lang, "en");
  assert.equal(root.title, "Growth Base · Mindfulness Journey");
  assert.equal(textNode.textContent, "Trainer");
});
```

Add `applyDocumentTranslations` to the imports from `src/i18n.js`.

- [ ] **Step 2: Run the contracts and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js tests/trainer-booking-contract.test.js
```

Expected: FAIL because the localization attributes and initializer are absent.

- [ ] **Step 3: Add the static DOM translation function**

Extend `src/i18n.js` with:

```js
const ATTRIBUTE_MAPPINGS = {
  "data-i18n": "textContent",
  "data-i18n-aria-label": "aria-label",
  "data-i18n-alt": "alt",
  "data-i18n-href": "href",
};

export function applyDocumentTranslations(
  root = document,
  translator = { locale, t },
) {
  root.documentElement.lang = translator.locale;
  for (const [dataAttribute, target] of Object.entries(ATTRIBUTE_MAPPINGS)) {
    for (const element of root.querySelectorAll(`[${dataAttribute}]`)) {
      const value = translator.t(element.getAttribute(dataAttribute));
      if (target === "textContent") element.textContent = value;
      else element.setAttribute(target, value);
    }
  }
  root.title = translator.t("meta.title");
}
```

- [ ] **Step 4: Add the complete static-shell dictionary keys**

Add the following exact Chinese/English pairs to both dictionaries:

| Key | `zh-CN` | `en` |
|---|---|---|
| `meta.title` | 成长基地 · 冥想闭环原型 | Growth Base · Mindfulness Journey |
| `welcome.skip` | 跳过欢迎动画 | Skip welcome animation |
| `welcome.streakLabel` | 连续坚持 | Streak |
| `welcome.dayUnit` | 天 | days |
| `header.streak` | 连续18天 | 18-day streak |
| `header.baseLevel` | 成长基地 | Growth Base |
| `header.menuAlt` | 小程序菜单 | App menu |
| `growth.statsLabel` | 成长数值 | Growth stats |
| `growth.pendingLabel` | 待领取成长奖励 | Growth rewards to collect |
| `reward.claimLabel` | 点击领取 | Claim |
| `reward.claimAria` | 点击领取静心帐篷 | Claim the Mindfulness Tent |
| `reward.objectAria` | 查看静心帐篷的获得记录 | View Mindfulness Tent record |
| `reward.tentName` | 静心帐篷 | Mindfulness Tent |
| `task.railLabel` | 今日安排 | Today's plan |
| `nav.primaryLabel` | 主要导航 | Primary navigation |
| `nav.coach` | AI教练 | AI Coach |
| `nav.trainer` | 预约私教 | Trainer |
| `nav.skill` | Skill | Skill |
| `nav.plan` | 训练计划 | Plan |
| `nav.points` | 积分 | Points |
| `nav.mine` | 我的 | Me |
| `trainer.pageLabel` | 预约私教 | Personal training |
| `trainer.coachName` | 李教练 | Coach Yang |
| `trainer.storeName` | 中田健身 · 南山旗舰店 | Fun Fitness · Victoria Flagship |
| `trainer.storeMapAria` | 在地图中导航到中田健身 · 南山旗舰店 | Navigate to Fun Fitness · Victoria Flagship |
| `trainer.storeMapHref` | `https://uri.amap.com/search?keyword=%E4%B8%AD%E7%94%B0%E5%81%A5%E8%BA%AB%20%E5%8D%97%E5%B1%B1%E6%97%97%E8%88%B0%E5%BA%97&city=%E6%B7%B1%E5%9C%B3&src=meditation-prototype` | `https://www.google.com/maps/search/?api=1&query=Fun%20Fitness%20Victoria%20Flagship` |
| `trainer.eyebrow` | 我的教练 | My trainer |
| `trainer.ratingAria` | 评分 4.9，326条评价 | Rated 4.9 from 326 reviews |
| `trainer.reviews` | （326评价） | (326 reviews) |
| `trainer.bio` | 减脂塑形 · NASM-CPT认证 · 8年经验 | Fat loss · NASM-CPT · 8 years |
| `trainer.commerceAria` | 课程价格与服务记录 | Session price and service record |
| `trainer.price` | ¥298 | $50 |
| `trainer.priceUnit` | /节 · 45分钟 | / session · 45 min |
| `trainer.servedPrefix` | 已服务 | Completed |
| `trainer.servedSuffix` | 节课 | sessions |
| `booking.title` | 选择预约时间 | Choose a time |
| `booking.nextSevenDays` | 未来 7 天 | Next 7 days |
| `booking.datesAria` | 选择日期 | Choose a date |
| `booking.timesAria` | 选择时间 | Choose a time |
| `nearby.title` | 附近门店 | Nearby gyms |
| `nearby.summary` | 附近有3家 ｜ 深圳市有128家 | 3 nearby · 128 in the city |
| `nearby.mapAlt` | 深圳南山区附近门店地图 | Map of nearby gyms |
| `booking.cancel` | 取消 | Cancel |
| `booking.confirm` | 确认预约 | Confirm |
| `booking.sheetEyebrow` | 预约确认 | Booking confirmation |
| `booking.sheetTitle` | 李教练私教课 | Session with Coach Yang |
| `booking.courseLabel` | 课程 | Session |
| `booking.courseValue` | 减脂塑形 · 60分钟 | Fat loss · 60 min |
| `booking.timeLabel` | 时间 | Time |
| `booking.locationLabel` | 地点 | Location |
| `object.closeAria` | 关闭 | Close |
| `object.stage` | 静心营地 · 第一阶段 | Mindfulness Camp · Stage 1 |
| `object.story` | 由你本周完成的4次静心练习共同搭建，记录着逐渐稳定下来的下午节奏。 | Built from four mindfulness sessions this week, marking a steadier afternoon rhythm. |
| `object.obtainedLabel` | 获得时间 | Earned |
| `object.obtainedValue` | 2026年7月31日 | Jul 31, 2026 |
| `object.recordLabel` | 行为记录 | Activity |
| `object.recordValue` | 冥想4次 · 共20分钟 | 4 sessions · 20 min total |

- [ ] **Step 5: Annotate every static node in `index.html`**

Keep the existing Chinese fallback text and add the matching attribute. Examples:

```html
<title data-i18n="meta.title">成长基地 · 冥想闭环原型</title>
<nav class="bottom-nav" aria-label="主要导航" data-i18n-aria-label="nav.primaryLabel">
  <span class="nav-label" data-i18n="nav.trainer">预约私教</span>
</nav>
<img data-deferred-src="./assets/trainer-hero.png" alt="李教练" data-i18n-alt="trainer.coachName" />
<a
  class="trainer-store"
  data-i18n-href="trainer.storeMapHref"
  data-i18n-aria-label="trainer.storeMapAria"
>
  <span data-i18n="trainer.storeName">中田健身 · 南山旗舰店</span>
</a>
<strong data-i18n="trainer.price">¥298</strong>
```

Apply the same mapping to every static string listed in Step 4. Preserve numeric-only content, times, `Lv.2`, `NEW`, distances, map-pin numbers, and decorative empty `alt` values without translation attributes.

- [ ] **Step 6: Initialize static translations before mounting dynamic views**

At the top of `src/app.js`, import and call:

```js
import { applyDocumentTranslations, t } from "./i18n.js";

applyDocumentTranslations(document);
```

The call must occur before `mountTrainerBooking(...)` so the trainer module reads already-localized static controls.

- [ ] **Step 7: Run focused tests and commit**

```bash
node --test tests/i18n.test.js tests/visual-contract.test.js tests/trainer-booking-contract.test.js
git add index.html src/i18n.js src/app.js tests/visual-contract.test.js tests/trainer-booking-contract.test.js
git commit -m "feat: localize static application shell"
```

Expected: all focused tests PASS.

### Task 3: Localize Home, Meditation, Tasks, And Growth UI

**Files:**
- Modify: `src/i18n.js`
- Modify: `src/experience.js`
- Modify: `src/growth-stats.js`
- Modify: `src/app.js:34-355,571-717,756-849`
- Modify: `tests/experience.test.js`
- Modify: `tests/growth-stats.test.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Write failing locale-neutral model tests**

Update `tests/experience.test.js` to require greeting and schedule keys:

```js
assert.equal(getGreetingKey(8), "greeting.morning");
assert.equal(getGreetingKey(14), "greeting.afternoon");
assert.equal(getGreetingKey(21), "greeting.evening");
assert.equal(getGreetingKey(2), "greeting.lateNight");

assert.deepEqual(
  buildSchedule("recommendation").map(({ id, labelKey, reward }) => ({
    id,
    labelKey,
    rewardLabelKey: reward.labelKey,
  })),
  [
    { id: "water-am", labelKey: "task.water", rewardLabelKey: "growth.vitality" },
    { id: "lunch", labelKey: "task.lunch", rewardLabelKey: "growth.stamina" },
    { id: "meditation", labelKey: "task.meditation", rewardLabelKey: "growth.focus" },
    { id: "dinner", labelKey: "task.dinner", rewardLabelKey: "growth.stamina" },
    { id: "water-pm", labelKey: "task.water", rewardLabelKey: "growth.vitality" },
    { id: "fitness", labelKey: "task.fitness", rewardLabelKey: "growth.vitality" },
    { id: "stretch", labelKey: "task.stretch", rewardLabelKey: "growth.vitality" },
  ],
);
```

Update `tests/growth-stats.test.js` to assert `labelKey` values in vitality, focus, stamina order.

Add a contract assertion that `src/app.js` imports `t`, uses `t(labelKey)`, and does not define `ATTRIBUTE_LABELS` with Chinese values.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
node --test tests/experience.test.js tests/growth-stats.test.js tests/visual-contract.test.js
```

Expected: FAIL on the missing key-based model and dynamic translations.

- [ ] **Step 3: Convert domain definitions to translation keys**

In `src/experience.js`, change schedule entries to this form and rename `getGreeting`:

```js
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
```

In `src/growth-stats.js`, replace each `label` with `labelKey` using `growth.vitality`, `growth.focus`, and `growth.stamina`.

- [ ] **Step 4: Add the complete dynamic home dictionary**

Add these exact pairs to `TRANSLATIONS`:

| Key | `zh-CN` | `en` |
|---|---|---|
| `greeting.morning` | 早上好 | Good morning |
| `greeting.afternoon` | 下午好 | Good afternoon |
| `greeting.evening` | 晚上好 | Good evening |
| `greeting.lateNight` | 这么晚还没休息吗 | Still awake? |
| `home.greetingTitle` | {greeting}，Maggie | {greeting}, Maggie |
| `home.timeAdvice` | 15:30 · AI健康建议 | 15:30 · AI health tip |
| `home.recommendation` | 你通常在下午3点后注意力下降，今天安排5分钟放松吧。 | Your focus often dips after 3 PM. Take five minutes to reset. |
| `home.startMeditation` | 开始冥想 | Start meditation |
| `growth.vitality` | 活力 | Vitality |
| `growth.focus` | 专注 | Focus |
| `growth.stamina` | 体力 | Stamina |
| `growth.collectAria` | 领取{label} {value} | Collect {label} {value} |
| `growth.statAria` | {label} {value} | {label} {value} |
| `growth.progressEarned` | 今日任务 {progress}/4，帐篷营地已获得 | Today's tasks {progress}/4 · Tent earned |
| `growth.progressPending` | 今日任务 {progress}/4，完成可获得帐篷营地 | Today's tasks {progress}/4 · Complete to earn the tent |
| `task.water` | 补充水分 | Hydrate |
| `task.lunch` | 营养午餐 | Balanced lunch |
| `task.meditation` | 冥想 | Meditation |
| `task.dinner` | 健康晚餐 | Healthy dinner |
| `task.fitness` | 力量训练 | Strength |
| `task.stretch` | 睡前拉伸 | Evening stretch |
| `task.current` | 当前 | Now |
| `task.completedAria` | ，已完成 | , completed |
| `task.currentAria` | ，当前任务 | , current task |
| `task.cardAria` | {time} {label}，{reward}加{value}{status} | {time} {label}, {reward} plus {value}{status} |
| `timer.remaining` | 剩余时间 | Remaining |
| `timer.remainingAria` | 剩余时间{time} | {time} remaining |
| `timer.pausedPrompt` | 已暂停，准备好再继续 | Paused. Continue when ready. |
| `timer.breathPrompt` | 缓慢吸气，再慢慢呼出 | Breathe in slowly, then breathe out. |
| `timer.controlsAria` | 冥想控制 | Meditation controls |
| `timer.pauseAria` | 暂停冥想 | Pause meditation |
| `timer.resumeAria` | 继续冥想 | Resume meditation |
| `timer.endAria` | 结束冥想 | End meditation |
| `reward.newObject` | 静心营地 · 新物件 | Mindfulness Camp · New item |
| `reward.unlockedTitle` | 静心帐篷已解锁 | Mindfulness Tent unlocked |
| `reward.claimedEyebrow` | 领取成功 | Claimed |
| `reward.claimedTitle` | 静心帐篷已放入营地 | Mindfulness Tent added to camp |
| `meal.completed` | 静心练习已完成 | Mindfulness session complete |
| `meal.prepTitle` | 晚餐正在准备中 | Dinner is being prepared |
| `meal.prepCopy` | 17:30 回来看看，今晚吃得轻松一点。 | Come back at 17:30 for an easy dinner. |
| `meal.reminderSet` | 提醒已设置 | Reminder set |
| `meal.remindMe` | 17:30 提醒我 | Remind me at 17:30 |
| `meal.timeAdvice` | 17:30 · 今日健康建议 | 17:30 · Today's health tip |
| `meal.readyTitle` | 晚餐时间到了 | Dinner is ready |
| `meal.readyCopy` | 好好吃饭，也是今天恢复计划的一部分。 | A good meal is part of today's recovery. |
| `meal.start` | 我开动了 | Start meal |
| `toast.comingSoon` | 敬请期待 | Coming soon |
| `toast.reminderSet` | 提醒已设置 | Reminder set |

- [ ] **Step 5: Translate every dynamic home render path**

Update `src/app.js` so:

- `taskCard()` accepts `labelKey` and `reward.labelKey`, resolves them once, and uses `t("task.cardAria", params)`.
- growth bubble and stat labels use `t(item.labelKey)`.
- `growthCue()` chooses `growth.progressEarned` or `growth.progressPending` with `{ progress }`.
- `setupDailyWelcome()` uses `t(getGreetingKey(hour))`.
- every string in `render()` from recommendation through meal time uses the exact key from Step 4.
- toast call sites pass keys and `showToast(key)` assigns `t(key)`.

The core render pattern is:

```js
const label = t(labelKey);
const rewardLabel = t(reward.labelKey);
const statusText = done
  ? t("task.completedAria")
  : current
    ? t("task.currentAria")
    : "";

welcomeGreeting.textContent = t("home.greetingTitle", {
  greeting: t(getGreetingKey(new Date().getHours())),
});
```

- [ ] **Step 6: Run focused and full tests, then commit**

```bash
node --test tests/i18n.test.js tests/experience.test.js tests/growth-stats.test.js tests/visual-contract.test.js
npm test
git add src/i18n.js src/experience.js src/growth-stats.js src/app.js tests/i18n.test.js tests/experience.test.js tests/growth-stats.test.js tests/visual-contract.test.js
git commit -m "feat: localize meditation and growth flows"
```

Expected: focused tests and the full suite PASS.

### Task 4: Localize Trainer Booking And Dates

**Files:**
- Modify: `src/i18n.js`
- Modify: `src/trainer-booking.js`
- Modify: `src/trainer-booking-view.js`
- Modify: `index.html:146-270`
- Modify: `tests/trainer-booking.test.js`
- Modify: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Write failing locale-neutral booking tests**

Update `tests/trainer-booking.test.js` to require no localized weekday, coach, or store in state:

```js
test("creates locale-neutral booking dates", () => {
  const dates = createBookingDates(today);
  assert.deepEqual(dates[0], {
    key: "2026-08-02",
    day: 2,
    isToday: true,
  });
  assert.equal("weekday" in dates[0], false);
});

test("stores translation keys in confirmed booking state", () => {
  const selected = transitionBooking(createInitialBookingState(today), {
    type: "SELECT_TIME",
    time: "11:00",
  });
  const confirmed = transitionBooking(selected, { type: "CONFIRM_BOOKING" });
  assert.deepEqual(confirmed.confirmedBooking, {
    dateKey: todayKey,
    time: "11:00",
    coachKey: "trainer.coachName",
    storeKey: "trainer.storeName",
  });
});
```

Add trainer contract assertions for imports of `locale`, `t`, `formatBookingDate`, and `formatWeekday`, plus use of `t(confirmed.coachKey)`.

- [ ] **Step 2: Run booking tests and verify RED**

```bash
node --test tests/trainer-booking.test.js tests/trainer-booking-contract.test.js
```

Expected: FAIL on localized state and hard-coded booking view strings.

- [ ] **Step 3: Make booking state locale-neutral**

Remove `WEEKDAY_FORMATTER`, `COACH`, and `STORE` from `src/trainer-booking.js`. `createBookingDates()` returns only `key`, `day`, and `isToday`. Confirmation stores:

```js
confirmedBooking: {
  dateKey: state.selectedDateKey,
  time: state.selectedTime,
  coachKey: "trainer.coachName",
  storeKey: "trainer.storeName",
},
```

- [ ] **Step 4: Add the remaining trainer dictionary keys**

Add these exact pairs:

| Key | `zh-CN` | `en` |
|---|---|---|
| `date.today` | 今天 | Today |
| `booking.dateAria` | {weekday}{day}日{status} | {weekday}, {day}{status} |
| `booking.dateConfirmed` | ，已有预约 | , booked |
| `booking.timeConfirmed` | {time}，已预约 | {time}, booked |
| `booking.timeUnavailable` | {time}，不可预约 | {time}, unavailable |
| `booking.timeAvailable` | {time}，可预约 | {time}, available |
| `booking.status` | ✓ 已预约 · {date} {time} · {coach} | ✓ Booked · {date} {time} · {coach} |
| `booking.actionContext` | 李教练 · 60分钟 | Coach Yang · 60 min |
| `booking.success` | ✓ 预约成功 | ✓ Booked |
| `store.nearest` | 最近 | Nearest |
| `store.open` | 营业中 | Open |
| `store.closed` | 已打烊 | Closed |
| `store.oneName` | 南浦大桥店 | Nanpu Bridge Gym |
| `store.oneAddress` | 南浦一路111号一层 | 111 Nanpu 1st Rd, Level 1 |
| `store.twoName` | 前海湾旗舰店 | Qianhai Bay Flagship |
| `store.twoAddress` | 前海路99号B1层 | 99 Qianhai Rd, B1 |
| `store.threeName` | 海上世界店 | Sea World Gym |
| `store.threeAddress` | 望海路1187号商业中心 | 1187 Wanghai Rd, Commercial Center |
| `store.featuresTrialPosture` | 私教体验 · 体态检测 | Training trial · Posture assessment |
| `store.featuresTrialParking` | 私教体验 · 停车方便 | Training trial · Easy parking |
| `store.featuresPostureParking` | 体态检测 · 停车方便 | Posture assessment · Easy parking |

- [ ] **Step 5: Render localized dates and booking states**

In `src/trainer-booking-view.js`, import:

```js
import {
  formatBookingDate,
  formatWeekday,
  locale,
  t,
} from "./i18n.js";
```

Replace helpers with:

```js
function weekdayLabel(date) {
  return date.isToday ? t("date.today") : formatWeekday(date.key, locale);
}

function fullDateLabel(dateKey) {
  return formatBookingDate(dateKey, locale);
}
```

Render dates and statuses with localized values:

```js
const weekday = weekdayLabel(date);
button.setAttribute("aria-label", t("booking.dateAria", {
  weekday,
  day: date.day,
  status: confirmed ? t("booking.dateConfirmed") : "",
}));
button.innerHTML = `<span>${weekday}</span><strong>${date.day}</strong>`;

bookingStatus.textContent = confirmed
  ? t("booking.status", {
      date: formatBookingDate(confirmed.dateKey, locale),
      time: confirmed.time,
      coach: t(confirmed.coachKey),
    })
  : "";
```

Use the time availability keys for `aria-label`, `booking.confirm` when opening the dialog, and `booking.success` after confirmation. Use `formatBookingDate()` for the dialog time and action tray.

- [ ] **Step 6: Finish static store mappings**

Annotate all three store names, addresses, statuses, feature labels, and the booking action context in `index.html` with the exact keys from Step 4. Keep opening hours and distances unchanged.

- [ ] **Step 7: Run focused and full tests, then commit**

```bash
node --test tests/i18n.test.js tests/trainer-booking.test.js tests/trainer-booking-contract.test.js
npm test
git add src/i18n.js src/trainer-booking.js src/trainer-booking-view.js index.html tests/i18n.test.js tests/trainer-booking.test.js tests/trainer-booking-contract.test.js
git commit -m "feat: localize trainer booking flow"
```

Expected: focused tests and the full suite PASS.

### Task 5: Enforce Translation Completeness And Cache Refresh

**Files:**
- Modify: `src/i18n.js`
- Modify: `index.html:9,288`
- Modify: `tests/i18n.test.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Replace temporary fallback fixtures**

Delete `test.chineseFallback` and `test.missingEverywhere` from production dictionaries. Change the fallback unit test to temporarily remove and restore a real English key:

```js
test("falls back to Chinese without exposing raw keys", () => {
  const warnings = [];
  const original = TRANSLATIONS.en["toast.comingSoon"];
  delete TRANSLATIONS.en["toast.comingSoon"];
  const english = createTranslator("en", { warn: (message) => warnings.push(message) });
  assert.equal(english.t("toast.comingSoon"), "敬请期待");
  assert.equal(english.t("missing.everywhere"), "");
  TRANSLATIONS.en["toast.comingSoon"] = original;
  assert.equal(warnings.length, 3);
});
```

- [ ] **Step 2: Add source audits for migrated dynamic strings**

In `tests/visual-contract.test.js`, scan the dynamic render modules and reject the exact migrated Chinese UI phrases:

```js
test("keeps migrated dynamic UI copy behind localization keys", () => {
  const dynamicSources = [app, experience, growthStatsModel, trainerBooking, trainerView].join("\n");
  for (const phrase of [
    "开始冥想",
    "缓慢吸气，再慢慢呼出",
    "静心帐篷已解锁",
    "晚餐正在准备中",
    "敬请期待",
    "确认预约",
    "预约成功",
    "不可预约",
  ]) {
    assert.doesNotMatch(dynamicSources, new RegExp(phrase));
  }
});
```

Define `experience`, `trainerBooking`, and `trainerView` using `readFileSync` at the top of the test file. Static Chinese fallback in `index.html` remains allowed.

- [ ] **Step 3: Version localized assets**

Update both cache-busting references in `index.html`:

```html
<link rel="stylesheet" href="./src/styles.css?v=20260806-i18n" />
<script type="module" src="./src/app.js?v=20260806-i18n"></script>
```

Add a contract asserting both version strings.

- [ ] **Step 4: Run the complete automated verification**

```bash
node --test tests/i18n.test.js tests/visual-contract.test.js
npm test
git diff --check
```

Expected: all tests PASS and `git diff --check` prints no output.

- [ ] **Step 5: Commit the completeness guards**

```bash
git add src/i18n.js index.html tests/i18n.test.js tests/visual-contract.test.js
git commit -m "test: enforce localization completeness"
```

### Task 6: Verify Both Languages In A Real Browser

**Files:**
- Verify: `index.html`
- Verify: `src/i18n.js`
- Verify: `src/app.js`
- Verify: `src/trainer-booking-view.js`
- Verify: `src/styles.css`
- Verify: `src/trainer-booking.css`

- [ ] **Step 1: Start an isolated local preview**

Run from the feature worktree:

```bash
python3 -m http.server 4180 --bind 127.0.0.1
```

Use another free port if `4180` is occupied.

- [ ] **Step 2: Verify locale resolution**

Open each URL and inspect `<html lang>` plus visible content:

```text
http://127.0.0.1:4180/?lang=zh-CN
http://127.0.0.1:4180/?lang=en
http://127.0.0.1:4180/?lang=fr
```

Expected: Chinese, English, and Chinese fallback respectively. Confirm there is no visible language switcher.

- [ ] **Step 3: Verify the complete Chinese flow**

At `375x667`, `375x812`, and `402x874`, verify:

- home greeting, task cards, growth bubbles, and navigation remain identical to the approved Chinese UI;
- meditation recommendation, active timer, pause/resume labels, completion, reward, meal preparation, and meal time remain Chinese;
- trainer booking, date selection, confirmation, confirmed status, and cancellation remain Chinese;
- trainer identity remains `李教练`, store remains `中田健身 · 南山旗舰店`, and price remains `¥298`.

Capture:

```text
/tmp/i18n-zh-375x667-home.png
/tmp/i18n-zh-375x812-active.png
/tmp/i18n-zh-402x874-trainer.png
/tmp/i18n-zh-402x874-confirmed.png
```

- [ ] **Step 4: Verify the complete English flow**

At the same three viewports, verify:

- every visible and accessible string is English;
- trainer identity is `Coach Yang`, store is `Fun Fitness · Victoria Flagship`, and price is `$50`;
- booking dates use `Today`, short English weekdays, and full labels such as `Tue, Aug 11`;
- navigation uses `AI Coach`, `Trainer`, `Skill`, `Plan`, `Points`, `Me`;
- task cards, bubbles, timer, buttons, booking tray, dialog, statuses, stores, toast, and object dialog contain no Chinese text;
- no text overflows, clips, changes fixed card dimensions, covers the pony, or overlaps controls.

Capture:

```text
/tmp/i18n-en-375x667-home.png
/tmp/i18n-en-375x812-active.png
/tmp/i18n-en-402x874-trainer.png
/tmp/i18n-en-402x874-confirmed.png
```

- [ ] **Step 5: Verify accessibility and runtime health**

For both locales, inspect accessible names for the growth stats, reward bubbles, timer controls, navigation, date buttons, time buttons, trainer map link, dialog, and close controls. Confirm the visible text and accessible names use the same language.

Expected browser diagnostics:

```text
console errors: 0
page errors: 0
failed network requests: 0
horizontal document overflow: 0px
```

- [ ] **Step 6: Run final repository verification**

Stop the temporary server, then run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests PASS, the diff check is clean, and the worktree contains no tracked changes after commits.

### Task 7: Final Whole-Feature Review

**Files:**
- Review: `src/i18n.js`
- Review: `index.html`
- Review: `src/app.js`
- Review: `src/experience.js`
- Review: `src/growth-stats.js`
- Review: `src/trainer-booking.js`
- Review: `src/trainer-booking-view.js`
- Review: localization-related tests

- [ ] **Step 1: Review requirements line by line**

Confirm all of the following against the implementation and browser evidence:

- only `zh-CN` and `en` are supported;
- URL override takes priority, browser language is second, Chinese is fallback;
- no visible switcher and no persisted language preference exist;
- all static, dynamic, assistive, date, status, and toast strings are mapped;
- Chinese proper names and `¥298` remain unchanged;
- English uses `Coach Yang`, `Fun Fitness · Victoria Flagship`, and `$50`;
- domain state contains translation keys rather than localized display values;
- the portfolio/showcase remains excluded;
- layout and interactions are unchanged.

- [ ] **Step 2: Run final tests from a fresh shell**

```bash
npm test
git diff --check
git status --short
```

Expected: all tests PASS, no whitespace errors, and no tracked changes.

- [ ] **Step 3: Use the branch-finishing workflow**

After review approval, use `superpowers:finishing-a-development-branch` to offer local merge, push/PR, keep, or discard. Do not merge or deploy without the user's selection.
