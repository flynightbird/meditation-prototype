# 首页成长数值入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页右上角增加活力、专注、体力统计入口，并让领取气泡准确飞入对应入口后按“旧值 → 图标+增量 → 新总数”翻滚一次。

**Architecture:** `src/growth.js` 保持领域状态与领取计算，新增 `src/growth-stats.js` 将 totals 转成稳定的展示模型。`src/app.js` 负责入口 DOM、实时坐标飞行和按属性排队的临时翻滚状态；最终总数仍只来自持久化的 `growthState.totals`。

**Tech Stack:** 原生 HTML、CSS、JavaScript ES modules、Node.js `node:test`、本地 PNG 素材、Playwright 浏览器验收

---

## 文件结构

- Create: `src/growth-stats.js` — 将成长总数映射为固定顺序的展示项。
- Create: `tests/growth-stats.test.js` — 覆盖 0 值图标、非 0 数字和展示顺序。
- Create: `assets/growth-vitality.png` — 活力 0 值图标。
- Create: `assets/growth-focus.png` — 专注 0 值图标。
- Create: `assets/growth-stamina.png` — 体力 0 值图标。
- Modify: `src/growth.js` — 提供一次领取在提交前的属性与数值预览。
- Modify: `tests/growth.test.js` — 覆盖合并气泡、无效领取和总数预览。
- Modify: `index.html` — 增加统计组挂载节点并更新样式版本。
- Modify: `src/app.js` — 渲染统计入口，编排飞行、提交和翻滚队列。
- Modify: `src/styles.css` — 实现 Figma 布局、实时位移飞行、翻滚和减少动态效果。
- Modify: `tests/visual-contract.test.js` — 锁定结构、素材、动效和私教页隐藏规则。

### Task 1: 建立统计展示模型

**Files:**
- Create: `src/growth-stats.js`
- Create: `tests/growth-stats.test.js`

- [ ] **Step 1: 写展示模型的失败测试**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { getGrowthStatItems } from "../src/growth-stats.js";

test("orders vitality, focus, and stamina and uses icons only for zero totals", () => {
  assert.deepEqual(getGrowthStatItems({ vitality: 0, focus: 20, stamina: 0 }), [
    { attribute: "vitality", label: "活力", total: 0, mode: "icon", icon: "./assets/growth-vitality.png" },
    { attribute: "focus", label: "专注", total: 20, mode: "value", icon: "./assets/growth-focus.png" },
    { attribute: "stamina", label: "体力", total: 0, mode: "icon", icon: "./assets/growth-stamina.png" },
  ]);
});

test("treats every positive total as a numeric value", () => {
  assert.deepEqual(
    getGrowthStatItems({ vitality: 10, focus: 1, stamina: 30 }).map(({ mode, total }) => ({ mode, total })),
    [{ mode: "value", total: 10 }, { mode: "value", total: 1 }, { mode: "value", total: 30 }],
  );
});
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `node --test tests/growth-stats.test.js`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现最小展示模型**

```js
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
```

- [ ] **Step 4: 运行聚焦测试**

Run: `node --test tests/growth-stats.test.js`

Expected: 2 tests PASS。

- [ ] **Step 5: 提交展示模型**

```bash
git add src/growth-stats.js tests/growth-stats.test.js
git commit -m "feat: model home growth stats"
```

### Task 2: 接入素材与 Figma 统计入口

**Files:**
- Create: `assets/growth-vitality.png`
- Create: `assets/growth-focus.png`
- Create: `assets/growth-stamina.png`
- Modify: `index.html:9-115`
- Modify: `src/app.js:1-148,737-740`
- Modify: `src/styles.css:320-356`
- Modify: `tests/visual-contract.test.js:455-476`

- [ ] **Step 1: 写静态结构和素材的失败契约测试**

```js
test("renders three non-interactive growth stats in the Figma order", () => {
  assert.match(html, /id="growthStats"[^>]*aria-label="成长数值"/);
  assert.match(app, /getGrowthStatItems\(growthState\.totals\)/);
  assert.match(app, /data-growth-stat="\$\{attribute\}"/);
  assert.match(app, /growth-vitality\.png/);
  assert.match(app, /growth-focus\.png/);
  assert.match(app, /growth-stamina\.png/);
  assert.doesNotMatch(app, /<button[^>]*data-growth-stat/);
});

test("uses fixed Figma-sized glass stat entries and hides them on the trainer page", () => {
  assert.match(css, /\.growth-stat-main\s*{[^}]*width:\s*40px[^}]*height:\s*40px[^}]*border-radius:\s*14px/s);
  assert.match(css, /\.growth-stats\s*{[^}]*right:\s*20px[^}]*display:\s*grid/s);
  assert.match(css, /\.is-trainer-view \.growth-stats\s*{[^}]*display:\s*none/s);
});
```

- [ ] **Step 2: 运行契约测试并确认失败**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL，首个失败指出缺少 `growthStats`。

- [ ] **Step 3: 从用户 ZIP 解出并复制三个素材**

```bash
asset_tmp=$(mktemp -d /tmp/zhongtian-growth.XXXXXX)
ditto -x -k /Users/admin/Downloads/中田.zip "$asset_tmp"
cp "$asset_tmp/活力.png" assets/growth-vitality.png
cp "$asset_tmp/专注.png" assets/growth-focus.png
cp "$asset_tmp/体力.png" assets/growth-stamina.png
```

Expected: `file assets/growth-*.png` 显示三个文件均为 200×200 RGBA PNG。

- [ ] **Step 4: 在首页增加非交互挂载节点**

在 `app-header` 后、`message` 前加入：

```html
<aside class="growth-stats" id="growthStats" aria-label="成长数值" aria-live="polite"></aside>
```

同时把 `src/styles.css` 查询参数更新为本功能日期版本，避免静态预览命中旧 CSS。

- [ ] **Step 5: 渲染 0 值图标和非 0 数字**

在 `src/app.js` 导入 `getGrowthStatItems`，缓存 `growthStats`，增加：

```js
function statMainContent({ mode, icon, total }) {
  return mode === "icon"
    ? `<img class="growth-stat-icon" src="${icon}" alt="" />`
    : `<strong class="growth-stat-value">${total}</strong>`;
}

function renderGrowthStats() {
  growthStats.innerHTML = getGrowthStatItems(growthState.totals)
    .map(({ attribute, label, total, mode, icon }) => `
      <div class="growth-stat growth-stat-${attribute}" data-growth-stat="${attribute}" aria-label="${label} ${total}">
        <span class="growth-stat-main">${statMainContent({ mode, icon, total })}</span>
        <span class="growth-stat-label">${label}</span>
      </div>`)
    .join("");
}
```

在初始 `renderGrowthBubbles()` 前调用 `renderGrowthStats()`。

- [ ] **Step 6: 加入 Figma 基础样式**

```css
.growth-stats {
  position: absolute;
  z-index: 14;
  top: 111px;
  right: 20px;
  display: grid;
  gap: 12px;
  pointer-events: none;
}

.growth-stat {
  position: relative;
  display: grid;
  width: 40px;
  justify-items: center;
  padding-bottom: 11px;
}

.growth-stat-main {
  display: grid;
  width: 40px;
  height: 40px;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  color: #fff;
  background: rgba(255, 254, 244, 0.5);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(5.6px);
}

.growth-stat-icon { width: 28px; height: 28px; object-fit: contain; }
.growth-stat-value { font-size: 14px; font-weight: 500; line-height: 1; }
.growth-stat-label {
  position: absolute;
  bottom: 0;
  min-width: 33px;
  padding: 1px 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #17130f;
  font-size: 11px;
  line-height: 14px;
  text-align: center;
}
.growth-stat-vitality .growth-stat-label { background: #e8ffe5; }
.growth-stat-focus .growth-stat-label { background: #dfdfdf; }
.growth-stat-stamina .growth-stat-label { background: #fff3b1; }
.is-trainer-view .growth-stats { display: none; }
```

- [ ] **Step 7: 运行聚焦测试并提交**

Run: `node --test tests/growth-stats.test.js tests/visual-contract.test.js`

Expected: 新增测试 PASS，现有视觉契约无回归。

```bash
git add assets/growth-vitality.png assets/growth-focus.png assets/growth-stamina.png index.html src/app.js src/styles.css tests/visual-contract.test.js
git commit -m "feat: add home growth stat entries"
```

### Task 3: 提供领取预览并锁定一次性累计

**Files:**
- Modify: `src/growth.js:73-92`
- Modify: `tests/growth.test.js:114-132`

- [ ] **Step 1: 写领取预览的失败测试**

```js
test("previews a merged collection without mutating totals", () => {
  let state = createGrowthState("2026-08-04");
  state = addTaskReward(state, reward("r1", "t1", "focus", 4, 10));
  state = addTaskReward(state, reward("r2", "t2", "focus", 6, 20));

  assert.deepEqual(previewBubbleCollection(state, ["r1", "r2"]), {
    attribute: "focus",
    increment: 10,
    previousTotal: 0,
    nextTotal: 10,
  });
  assert.equal(state.totals.focus, 0);
});

test("does not preview missing, claimed, or mixed-attribute rewards", () => {
  let state = createGrowthState("2026-08-04");
  state = addTaskReward(state, reward("r1", "t1", "focus", 4, 10));
  state = addTaskReward(state, reward("r2", "t2", "stamina", 6, 20));
  assert.equal(previewBubbleCollection(state, ["missing"]), null);
  assert.equal(previewBubbleCollection(state, ["r1", "r2"]), null);
});
```

把 `previewBubbleCollection` 加入测试文件 import。

- [ ] **Step 2: 运行测试并确认导出缺失**

Run: `node --test tests/growth.test.js`

Expected: FAIL，指出 `previewBubbleCollection` 未导出。

- [ ] **Step 3: 实现纯领取预览**

```js
export function previewBubbleCollection(state, rewardIds) {
  const claimed = new Set(state.claimedRewardIds);
  const wanted = new Set(rewardIds);
  const rewards = state.pendingRewards.filter(({ id }) => wanted.has(id) && !claimed.has(id));
  if (rewards.length === 0) return null;
  const attributes = new Set(rewards.map(({ attribute }) => attribute));
  if (attributes.size !== 1) return null;
  const [attribute] = attributes;
  const increment = rewards.reduce((sum, reward) => sum + reward.value, 0);
  const previousTotal = state.totals[attribute];
  return { attribute, increment, previousTotal, nextTotal: previousTotal + increment };
}
```

- [ ] **Step 4: 复用预览结果完成领取累计**

在 `collectBubble` 中先调用 `previewBubbleCollection`；返回 `null` 时保持原 state，成功时用 `preview.nextTotal` 更新单一属性。保留 pending rewards 删除和 claimed IDs 追加逻辑。

- [ ] **Step 5: 运行测试并提交**

Run: `node --test tests/growth.test.js`

Expected: 所有 growth tests PASS。

```bash
git add src/growth.js tests/growth.test.js
git commit -m "feat: preview growth bubble collection"
```

### Task 4: 实现实时飞入和三段翻滚队列

**Files:**
- Modify: `src/app.js:17-188`
- Modify: `src/styles.css:356-510,1698-1725,2130-2183`
- Modify: `tests/visual-contract.test.js:455-490`

- [ ] **Step 1: 写动效编排的失败契约测试**

```js
test("flies bubbles to their live stat target before committing", () => {
  assert.match(app, /previewBubbleCollection\(growthState, rewardIds\)/);
  assert.match(app, /getBoundingClientRect\(\)/);
  assert.match(app, /--collect-x/);
  assert.match(app, /--collect-y/);
  assert.match(app, /queueGrowthStatRoll\(preview\)/);
});

test("rolls old value through icon plus increment to the new total", () => {
  assert.match(app, /growth-stat-roll-track/);
  assert.match(app, /growth-stat-roll-increment[^>]*>[\s\S]*\+\$\{increment\}/);
  assert.match(css, /@keyframes growth-stat-roll[\s\S]*translateY\(-66\.666%\)/);
  assert.match(css, /\.growth-stat-main\.is-rolling \.growth-stat-roll-track/);
});

test("reduces collection motion without waiting for animationend", () => {
  assert.match(app, /reducedMotion\.matches[\s\S]*commitGrowthCollection/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.growth-stat-main/s);
});
```

- [ ] **Step 2: 运行契约测试并确认失败**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL，首个新增测试指出缺少 `previewBubbleCollection` 调用。

- [ ] **Step 3: 为每个气泡加入属性和值，并计算实时目标**

在气泡模板加入：

```html
data-growth-attribute="${bubble.attribute}"
data-growth-value="${bubble.value}"
```

在 `collectGrowthReward` 中取得领取预览和目标入口：

```js
const preview = previewBubbleCollection(growthState, rewardIds);
const target = preview && growthStats.querySelector(`[data-growth-stat="${preview.attribute}"] .growth-stat-main`);
if (!preview || !target) return;
const sourceRect = button.getBoundingClientRect();
const targetRect = target.getBoundingClientRect();
button.style.setProperty("--collect-x", `${targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2}px`);
button.style.setProperty("--collect-y", `${targetRect.top + targetRect.height / 2 - sourceRect.top - sourceRect.height / 2}px`);
```

删除四个 `.anchor-*` 中写死的 `--collect-x` 和 `--collect-y`。

- [ ] **Step 4: 提交状态后按属性加入翻滚队列**

增加：

```js
const statRollQueues = new Map();

function queueGrowthStatRoll(preview) {
  const previous = statRollQueues.get(preview.attribute) || Promise.resolve();
  const next = previous.then(() => playGrowthStatRoll(preview));
  statRollQueues.set(preview.attribute, next.catch(() => {}));
  return next;
}
```

`commitGrowthCollection` 接收 preview，持久化新 state、重绘气泡后调用 `queueGrowthStatRoll(preview)`；失败时恢复按钮。减少动态效果分支直接提交、刷新目标入口并加一次 `is-updated` 透明度反馈，不依赖 `animationend`。

- [ ] **Step 5: 构造 A 时序的三段轨道**

```js
function playGrowthStatRoll({ attribute, increment, previousTotal, nextTotal }) {
  const stat = growthStats.querySelector(`[data-growth-stat="${attribute}"]`);
  const main = stat.querySelector(".growth-stat-main");
  const item = getGrowthStatItems({ ...growthState.totals, [attribute]: previousTotal })
    .find((entry) => entry.attribute === attribute);
  const firstFace = statMainContent({ ...item, total: previousTotal, mode: previousTotal === 0 ? "icon" : "value" });
  main.innerHTML = `<span class="growth-stat-roll-track">
    <span class="growth-stat-roll-face">${firstFace}</span>
    <span class="growth-stat-roll-face growth-stat-roll-increment"><img src="${item.icon}" alt="" /><b>+${increment}</b></span>
    <span class="growth-stat-roll-face"><strong class="growth-stat-value">${nextTotal}</strong></span>
  </span>`;
  main.classList.add("is-rolling");
  return new Promise((resolve) => {
    main.addEventListener("animationend", () => {
      main.classList.remove("is-rolling");
      main.innerHTML = `<strong class="growth-stat-value">${nextTotal}</strong>`;
      stat.setAttribute("aria-label", `${item.label} ${nextTotal}`);
      resolve();
    }, { once: true });
  });
}
```

实现时给动画增加与 CSS 时长一致的兜底 timer，页面失焦或动画事件丢失时也必须 resolve，并保证清理只执行一次。

- [ ] **Step 6: 增加三段翻滚和抵达反馈样式**

```css
.growth-stat-roll-track {
  display: grid;
  width: 100%;
  height: 300%;
  grid-template-rows: repeat(3, 1fr);
  transform: translateY(0);
}
.growth-stat-roll-face { display: grid; height: 40px; place-items: center; }
.growth-stat-roll-increment { grid-template-columns: 20px auto; gap: 1px; font-size: 10px; }
.growth-stat-roll-increment img { width: 20px; height: 20px; object-fit: contain; }
.growth-stat-roll-increment b { font-size: 10px; font-weight: 500; }
.growth-stat-main.is-rolling .growth-stat-roll-track {
  animation: growth-stat-roll 760ms cubic-bezier(.22,.8,.2,1) both;
}
.growth-stat-main.is-updated { animation: growth-stat-update 180ms ease-out both; }
@keyframes growth-stat-roll {
  0%, 18% { transform: translateY(0); }
  42%, 62% { transform: translateY(-33.333%); }
  100% { transform: translateY(-66.666%); }
}
@keyframes growth-stat-update { 50% { opacity: .68; } }
```

保留现有 `collect-growth-bubble` 时长，气泡抵达后才提交并开始入口翻滚。

- [ ] **Step 7: 运行聚焦与完整测试并提交**

Run: `node --test tests/growth.test.js tests/growth-stats.test.js tests/visual-contract.test.js`

Expected: 所有聚焦测试 PASS。

Run: `npm test`

Expected: 全部测试 PASS，0 failures。

```bash
git add src/app.js src/styles.css tests/visual-contract.test.js
git commit -m "feat: animate growth rewards into stats"
```

### Task 5: 浏览器视觉与交互验收

**Files:**
- Modify if required: `src/styles.css`
- Modify if required: `src/app.js`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: 启动独立预览服务**

Run: `python3 -m http.server 4177 --bind 127.0.0.1`

Expected: 服务保持运行，页面可通过 `http://127.0.0.1:4177/?v=growth-stats` 打开；若端口被占用，改用下一个空闲端口。

- [ ] **Step 2: 在 375×812 验证初始入口**

清空 `growth-base.growth-state` 后重载，确认：

- 活力、专注、体力从上到下排列。
- 三个 0 值入口分别显示树、书本、闪电。
- 入口不遮挡胶囊菜单、标题或气泡。
- 页面没有水平溢出，控制台无错误。

- [ ] **Step 3: 验证完整领取时序**

通过页面既有冥想完成流程产生“专注 +10”气泡，点击后确认：

- 气泡中心飞向专注入口中心。
- 抵达前入口保持旧值。
- 抵达后显示 `图标 +10` 中间画面。
- 最终显示 `10`，本地存储中的 `totals.focus` 为 10。
- 重载后仍显示 10。

再注入一个专注奖励，验证 `10 → 图标 +10 → 20`。

- [ ] **Step 4: 在 402×874 和减少动态效果下复验**

在 402×874 重复目标飞行，确认不同气泡锚点仍准确落到目标。开启 `prefers-reduced-motion: reduce` 后领取奖励，确认立即更新数字，仅出现轻微透明度反馈，不等待动画事件。

- [ ] **Step 5: 验证私教页隐藏与返回恢复**

点击“预约私教”后确认统计组不可见；返回 AI 教练后确认统计组恢复且数值正确。

- [ ] **Step 6: 保存验收截图并运行最终验证**

保存：

- `artifacts/growth-stats-375x812.png`
- `artifacts/growth-stats-402x874.png`
- `artifacts/growth-stats-rolling.png`

Run: `npm test && git diff --check`

Expected: 全部测试 PASS；`git diff --check` 无输出；浏览器控制台无 error。

- [ ] **Step 7: 提交视觉修正**

若浏览器验收产生代码修正：

```bash
git add src/app.js src/styles.css tests/visual-contract.test.js
git commit -m "style: refine home growth stat feedback"
```

若无需修正，不创建空提交。
