# Home Growth Bubbles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add time-aware homepage copy, lightweight daily-goal text, task reward badges, persistent collectible growth bubbles, and permanent attribute totals to the existing meditation prototype.

**Architecture:** Keep schedule metadata in `src/experience.js`, add a pure `src/growth.js` domain module for versioned state, reward aggregation, day rollover, and idempotent collection, and let `src/app.js` adapt that state to the existing DOM. Persist the complete growth envelope in one `localStorage` write so totals and pending rewards cannot diverge.

**Tech Stack:** Native ES modules, semantic HTML, CSS animations and custom properties, Node's built-in test runner, localStorage, in-app browser verification.

---

## File Map

- Create `src/growth.js`: reward state schema, normalization, daily progress, visible-bubble aggregation, and collection transaction.
- Create `tests/growth.test.js`: pure domain tests for caps, rollover, merge order, persistence shape, and idempotency.
- Modify `src/experience.js`: attach reward metadata to all seven schedule items.
- Modify `tests/experience.test.js`: lock the exact task-to-reward mapping.
- Modify `index.html`: add the semantic growth-bubble layer.
- Modify `src/app.js`: load and save the growth envelope, render greeting/progress/cards/bubbles, create the meditation reward, and collect bubbles.
- Modify `src/styles.css`: approved hierarchy, reward badges, current-label position, bubble palette, attached gradient rim, idle and collection motion, responsive anchors, and reduced-motion fallback.
- Modify `tests/visual-contract.test.js`: lock required markup, copy, card corners, palette, motion, and absence of a progress container.

### Task 1: Build the Pure Growth Domain

**Files:**
- Create: `src/growth.js`
- Create: `tests/growth.test.js`

- [ ] **Step 1: Write failing tests for the state envelope and daily progress**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  addTaskReward,
  collectBubble,
  createGrowthState,
  getDailyProgress,
  getVisibleBubbles,
  normalizeGrowthState,
} from "../src/growth.js";

test("caps the daily goal at four while preserving completed task ids", () => {
  let state = createGrowthState("2026-08-02", { initialProgress: 3 });
  state = addTaskReward(state, {
    id: "2026-08-02:meditation",
    taskId: "meditation",
    attribute: "focus",
    value: 10,
    createdAt: 10,
  });
  state = addTaskReward(state, {
    id: "2026-08-02:dinner",
    taskId: "dinner",
    attribute: "stamina",
    value: 10,
    createdAt: 20,
  });
  assert.equal(getDailyProgress(state), 4);
  assert.deepEqual(state.daily.completedTaskIds, ["meditation", "dinner"]);
});

test("rolls daily progress over without clearing permanent totals or pending rewards", () => {
  const previous = {
    ...createGrowthState("2026-08-01"),
    totals: { stamina: 20, focus: 10, vitality: 30 },
    pendingRewards: [{ id: "r1", taskId: "water-am", attribute: "vitality", value: 10, createdAt: 1 }],
  };
  const next = normalizeGrowthState(previous, "2026-08-02");
  assert.equal(next.daily.dateKey, "2026-08-02");
  assert.equal(next.daily.initialProgress, 0);
  assert.deepEqual(next.totals, previous.totals);
  assert.deepEqual(next.pendingRewards, previous.pendingRewards);
});
```

- [ ] **Step 2: Run the tests and verify the module is missing**

Run: `node --test tests/growth.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/growth.js`.

- [ ] **Step 3: Add aggregation and idempotency tests**

```js
test("shows at most four bubbles and merges the oldest duplicate attribute", () => {
  const state = {
    ...createGrowthState("2026-08-02"),
    pendingRewards: [
      { id: "v1", taskId: "water-am", attribute: "vitality", value: 10, createdAt: 1 },
      { id: "s1", taskId: "lunch", attribute: "stamina", value: 10, createdAt: 2 },
      { id: "f1", taskId: "meditation", attribute: "focus", value: 10, createdAt: 3 },
      { id: "v2", taskId: "water-pm", attribute: "vitality", value: 10, createdAt: 4 },
      { id: "s2", taskId: "dinner", attribute: "stamina", value: 10, createdAt: 5 },
    ],
  };
  const bubbles = getVisibleBubbles(state);
  assert.equal(bubbles.length, 4);
  assert.deepEqual(bubbles[0], {
    key: "v1+v2",
    rewardIds: ["v1", "v2"],
    attribute: "vitality",
    value: 20,
    createdAt: 1,
  });
});

test("collects every reward in a merged bubble exactly once", () => {
  const base = {
    ...createGrowthState("2026-08-02"),
    pendingRewards: [
      { id: "v1", taskId: "water-am", attribute: "vitality", value: 10, createdAt: 1 },
      { id: "v2", taskId: "water-pm", attribute: "vitality", value: 10, createdAt: 2 },
    ],
  };
  const once = collectBubble(base, ["v1", "v2"]);
  const twice = collectBubble(once, ["v1", "v2"]);
  assert.equal(once.totals.vitality, 20);
  assert.equal(twice.totals.vitality, 20);
  assert.deepEqual(twice.pendingRewards, []);
});
```

- [ ] **Step 4: Implement the minimal pure domain module**

```js
export const GROWTH_STATE_VERSION = 1;

export function createGrowthState(dateKey, { initialProgress = 0 } = {}) {
  return {
    version: GROWTH_STATE_VERSION,
    daily: { dateKey, initialProgress, completedTaskIds: [] },
    totals: { stamina: 0, focus: 0, vitality: 0 },
    pendingRewards: [],
    claimedRewardIds: [],
  };
}

export function normalizeGrowthState(value, dateKey) {
  if (!value || value.version !== GROWTH_STATE_VERSION) return createGrowthState(dateKey, { initialProgress: 3 });
  if (value.daily.dateKey === dateKey) return value;
  return { ...value, daily: { dateKey, initialProgress: 0, completedTaskIds: [] } };
}

export function getDailyProgress(state) {
  return Math.min(4, state.daily.initialProgress + state.daily.completedTaskIds.length);
}

export function addTaskReward(state, reward) {
  if (state.pendingRewards.some(({ id }) => id === reward.id) || state.claimedRewardIds.includes(reward.id)) return state;
  const completedTaskIds = state.daily.completedTaskIds.includes(reward.taskId)
    ? state.daily.completedTaskIds
    : [...state.daily.completedTaskIds, reward.taskId];
  return {
    ...state,
    daily: { ...state.daily, completedTaskIds },
    pendingRewards: [...state.pendingRewards, reward],
  };
}

function toBubble(rewards) {
  return {
    key: rewards.map(({ id }) => id).join("+"),
    rewardIds: rewards.map(({ id }) => id),
    attribute: rewards[0].attribute,
    value: rewards.reduce((sum, { value }) => sum + value, 0),
    createdAt: Math.min(...rewards.map(({ createdAt }) => createdAt)),
  };
}

export function getVisibleBubbles(state) {
  const groups = state.pendingRewards.map((reward) => [reward]);
  while (groups.length > 4) {
    let pair = null;
    for (let left = 0; left < groups.length && pair === null; left += 1) {
      const right = groups.findIndex(
        (group, index) => index > left && group[0].attribute === groups[left][0].attribute,
      );
      if (right !== -1) pair = { left, right };
    }
    groups[pair.left] = [...groups[pair.left], ...groups[pair.right]];
    groups.splice(pair.right, 1);
  }
  return groups.map(toBubble);
}

export function collectBubble(state, rewardIds) {
  const idSet = new Set(rewardIds.filter((id) => !state.claimedRewardIds.includes(id)));
  const collected = state.pendingRewards.filter(({ id }) => idSet.has(id));
  if (collected.length === 0) return state;
  const totals = { ...state.totals };
  for (const reward of collected) totals[reward.attribute] += reward.value;
  return {
    ...state,
    totals,
    pendingRewards: state.pendingRewards.filter(({ id }) => !idSet.has(id)),
    claimedRewardIds: [...state.claimedRewardIds, ...collected.map(({ id }) => id)],
  };
}
```

- [ ] **Step 5: Run the focused tests**

Run: `node --test tests/growth.test.js`

Expected: all growth tests PASS.

- [ ] **Step 6: Commit the domain layer**

```bash
git add src/growth.js tests/growth.test.js
git commit -m "feat: add persistent growth reward domain"
```

### Task 2: Attach Rewards to the Seven-Task Schedule

**Files:**
- Modify: `src/experience.js`
- Modify: `tests/experience.test.js`

- [ ] **Step 1: Add a failing exact reward-mapping test**

```js
test("maps every scheduled task to its approved growth reward", () => {
  assert.deepEqual(
    buildSchedule("recommendation").map(({ id, reward }) => ({ id, ...reward })),
    [
      { id: "water-am", attribute: "vitality", label: "活力", value: 10 },
      { id: "lunch", attribute: "stamina", label: "体力", value: 10 },
      { id: "meditation", attribute: "focus", label: "专注", value: 10 },
      { id: "dinner", attribute: "stamina", label: "体力", value: 10 },
      { id: "water-pm", attribute: "vitality", label: "活力", value: 10 },
      { id: "fitness", attribute: "vitality", label: "活力", value: 10 },
      { id: "stretch", attribute: "vitality", label: "活力", value: 10 },
    ],
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/experience.test.js`

Expected: FAIL because schedule items do not yet include `reward`.

- [ ] **Step 3: Add reward objects to every `BASE_SCHEDULE` entry**

```js
const BASE_SCHEDULE = [
  { id: "water-am", time: "08:00", label: "补充水分", icon: "water", reward: { attribute: "vitality", label: "活力", value: 10 } },
  { id: "lunch", time: "12:00", label: "营养午餐", icon: "meal", reward: { attribute: "stamina", label: "体力", value: 10 } },
  { id: "meditation", time: "15:30", label: "冥想", icon: "meditation", reward: { attribute: "focus", label: "专注", value: 10 } },
  { id: "dinner", time: "17:30", label: "健康晚餐", icon: "meal", reward: { attribute: "stamina", label: "体力", value: 10 } },
  { id: "water-pm", time: "18:30", label: "补充水分", icon: "water", reward: { attribute: "vitality", label: "活力", value: 10 } },
  { id: "fitness", time: "19:00", label: "力量训练", icon: "fitness", reward: { attribute: "vitality", label: "活力", value: 10 } },
  { id: "stretch", time: "22:30", label: "睡前拉伸", icon: "fitness", reward: { attribute: "vitality", label: "活力", value: 10 } },
];
```

Keep the existing status logic unchanged.

- [ ] **Step 4: Run experience tests**

Run: `node --test tests/experience.test.js`

Expected: all experience tests PASS.

- [ ] **Step 5: Commit schedule metadata**

```bash
git add src/experience.js tests/experience.test.js
git commit -m "feat: map schedule tasks to growth rewards"
```

### Task 3: Add Homepage Copy and Card Reward Badges

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing visual-contract tests**

```js
test("renders the approved greeting and lightweight daily goal copy", () => {
  assert.match(app, /\$\{getGreeting\(new Date\(\)\.getHours\(\)\)\}，Maggie/);
  assert.match(app, /今日任务 \$\{progress\}\/4，\$\{progress === 4 \? "帐篷营地已获得" : "完成可获得帐篷营地"\}/);
  assert.doesNotMatch(app, /growth-dots/);
  assert.match(css, /\.growth-cue\s*{[^}]*font-size:\s*12px[^}]*font-weight:\s*400/s);
  assert.doesNotMatch(css, /\.growth-cue\s*{[^}]*background:/s);
});

test("places task rewards top-right and the current label bottom-right", () => {
  assert.match(app, /class="task-reward reward-\$\{reward\.attribute\}"/);
  assert.match(app, /\$\{reward\.label\}[\s\S]*\+\$\{reward\.value\}/);
  assert.match(css, /\.task-reward\s*{[^}]*top:\s*5px[^}]*right:\s*5px/s);
  assert.match(css, /\.current-label\s*{[^}]*right:\s*7px[^}]*bottom:\s*6px/s);
});
```

- [ ] **Step 2: Run visual-contract tests and verify failure**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL on greeting, goal copy, reward badge, and current-label position.

- [ ] **Step 3: Replace `growthCue()` and update recommendation rendering**

Import `getDailyProgress`, render `下午好，Maggie` from `getGreeting(new Date().getHours())`, and make `growthCue(growthState)` return only:

```js
const progress = getDailyProgress(growthState);
const status = progress === 4 ? "帐篷营地已获得" : "完成可获得帐篷营地";
return `<p class="growth-cue">今日任务 ${progress}/4，${status}</p>`;
```

- [ ] **Step 4: Extend `taskCard()` with the approved corner badge**

Render the badge only when the card is not done:

```js
${!done ? `<span class="task-reward reward-${reward.attribute}" aria-hidden="true"><small>${reward.label}</small><b>+${reward.value}</b></span>` : ""}
${current ? '<span class="current-label">当前</span>' : ""}
```

Append `，${reward.label}加${reward.value}` to the card's `aria-label`. Do not add a pending-claim state.

- [ ] **Step 5: Add the approved typography and badge CSS**

Set `.time-label` to `11px`, weight `400`, `rgba(255,255,255,.58)`, and tighten its bottom gap. Set `.growth-cue` to a plain `12px`, weight `400`, `rgba(255,255,255,.82)` line with `8px` top margin and no background. Position `.task-reward` at the top-right and `.current-label` at the bottom-right.

- [ ] **Step 6: Run the focused tests**

Run: `node --test tests/experience.test.js tests/visual-contract.test.js`

Expected: PASS.

- [ ] **Step 7: Commit copy and card presentation**

```bash
git add src/app.js src/styles.css tests/visual-contract.test.js
git commit -m "feat: add daily goal and task reward badges"
```

### Task 4: Render Persistent Collectible Bubbles

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing markup and interaction contracts**

```js
test("provides a persistent collectible growth bubble layer", () => {
  assert.match(html, /id="growthBubbleLayer"[^>]*aria-label="待领取成长奖励"/);
  assert.match(app, /getVisibleBubbles\(growthState\)/);
  assert.match(app, /data-action="collect-growth"/);
  assert.match(app, /data-reward-ids="\$\{bubble\.rewardIds\.join\(","\)\}"/);
});
```

- [ ] **Step 2: Run the visual contract and verify failure**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because the layer and renderer are absent.

- [ ] **Step 3: Add the layer to `index.html`**

Insert this after `#rewardLayer` and before `#actionZone`:

```html
<section class="growth-bubble-layer" id="growthBubbleLayer" aria-label="待领取成长奖励"></section>
```

- [ ] **Step 4: Add storage and rendering adapters in `src/app.js`**

Use `growth-base.growth-state` as the single key. Parse defensively, normalize with `getLocalDateKey()`, and fall back to `createGrowthState(currentDateKey, { initialProgress: 3 })` on first load. `writeGrowthState(next)` must call `localStorage.setItem` once and return `true` or `false`.

The `initialProgress: 3` value is the approved prototype baseline that replaces the old camp `3/4` cue; it does not invent completed schedule IDs or pending rewards. Once the stored date rolls over, the baseline becomes `0`, and later progress is derived only from actual completed task IDs.

Define the display mapping beside the renderer:

```js
const ATTRIBUTE_LABELS = {
  stamina: "体力",
  focus: "专注",
  vitality: "活力",
};
```

Render each bubble as:

```js
<button
  class="growth-bubble bubble-${bubble.attribute} anchor-${index + 1}"
  type="button"
  data-action="collect-growth"
  data-reward-ids="${bubble.rewardIds.join(",")}"
  aria-label="领取${ATTRIBUTE_LABELS[bubble.attribute]} ${bubble.value}"
  style="--bubble-index:${index}"
>
  <small>${ATTRIBUTE_LABELS[bubble.attribute]}</small>
  <strong>+${bubble.value}</strong>
</button>
```

- [ ] **Step 5: Create the meditation reward exactly once**

When entering `reward` from `completion`, call `addTaskReward()` with ID `${dateKey}:meditation`, task `meditation`, attribute `focus`, value `10`, and `Date.now()`. Persist the returned envelope before rendering bubbles. Existing tent claim flow remains unchanged.

- [ ] **Step 6: Add collection handling**

For `data-action="collect-growth"`, reject repeated clicks while `.is-collecting` is present. Add `.is-collecting`, then on `animationend` compute `collectBubble(growthState, rewardIds)`, persist the full envelope once, and only replace in-memory state and rerender when the write succeeds. On write failure, remove `.is-collecting` so the reward remains available. Reduced-motion mode calls the same commit function immediately.

- [ ] **Step 7: Run all automated tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 8: Commit bubble markup and behavior**

```bash
git add index.html src/app.js tests/visual-contract.test.js
git commit -m "feat: render persistent collectible growth bubbles"
```

### Task 5: Apply the Approved Bubble Visual System and Motion

**Files:**
- Modify: `src/styles.css`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Add failing visual and reduced-motion contracts**

```js
test("uses the approved attached gradient bubble rim and palette", () => {
  assert.match(css, /\.growth-bubble\s*{[^}]*width:\s*62px[^}]*84%/s);
  assert.match(css, /\.growth-bubble::before\s*{[^}]*inset:\s*-2px[^}]*padding:\s*2px[^}]*conic-gradient/s);
  assert.match(css, /\.bubble-focus\s*{[^}]*#c5cec8/i);
  assert.match(css, /\.bubble-vitality\s*{[^}]*#e58a63/i);
  assert.match(css, /\.bubble-stamina\s*{[^}]*#ddb64c/i);
});

test("floats gently, flies top-right, and respects reduced motion", () => {
  assert.match(css, /@keyframes growth-bubble-float[\s\S]*translate3d\(0,\s*var\(--float-y\),\s*0\)/);
  assert.match(css, /@keyframes collect-growth-bubble[\s\S]*translate3d\(var\(--collect-x\),\s*var\(--collect-y\),\s*0\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.growth-bubble/);
});
```

- [ ] **Step 2: Run the contract tests and verify failure**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL on bubble palette, rim, keyframes, and reduced-motion rules.

- [ ] **Step 3: Add base bubble and palette CSS**

Implement `62px` circular buttons with `84%` color-mixed fill, `10px` labels, `17px/750` values, dark ink, inner highlight, and a `::before` rim using `inset:-2px`, `padding:2px`, a same-family conic gradient, and warm-white refraction. Define the exact palette tokens from the design spec.

- [ ] **Step 4: Add four responsive safe anchors**

Use absolute percentage positions scoped to `.growth-bubble-layer`, with `anchor-1` through `anchor-4` avoiding the message block, face focal area, action button, task rail, and navigation at both `375 x 812` and `402 x 874`. Adjust anchors inside the existing short-height media query rather than adding random placement.

- [ ] **Step 5: Add idle and collection animation**

Give each bubble `--float-y` between `-3px` and `-5px`, duration between `4s` and `6s`, and a negative delay derived from `--bubble-index`. Collection first scales to `.94`, brightens the rim, then uses viewport-relative `--collect-x` and `--collect-y` to shrink and travel toward the top-right before opacity reaches zero.

- [ ] **Step 6: Add focus and reduced-motion behavior**

Use a circular `:focus-visible` outline outside the gradient rim. Under reduced motion, disable idle and collection keyframes; keep a short opacity transition so the JavaScript immediate commit remains legible.

- [ ] **Step 7: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 8: Commit the visual system**

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "feat: style growth bubbles and collection motion"
```

### Task 6: Verify the Complete Experience

**Files:**
- Modify only if verification exposes a defect: `src/app.js`, `src/styles.css`, or focused tests.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all tests PASS with no skipped or cancelled tests.

- [ ] **Step 2: Start or reuse the local server**

Run: `npm start`

Expected: the prototype is available at `http://127.0.0.1:4173/`. If port `4173` is occupied by this project, reuse the existing server.

- [ ] **Step 3: Verify the initial homepage at both target sizes**

At `375 x 812` and `402 x 874`, confirm the time-aware greeting, weak AI label, exact plain-text daily goal, seven reward badges, right-bottom `当前` label, compact rail dimensions, and lack of a goal container or segment line.

- [ ] **Step 4: Verify reward generation and persistence**

Complete the meditation flow, wait for the completion video to enter the reward screen, and confirm one `专注 +10` bubble appears. Reload and navigate through the prototype; confirm it remains visible without replaying its generation animation.

- [ ] **Step 5: Verify collection and idempotency**

Collect the bubble once and confirm it floats to the top-right and disappears without a toast. Reload and confirm it does not return. Rapidly click during another collection and confirm the total changes only once.

- [ ] **Step 6: Verify overflow and accessibility with a focused browser fixture**

Seed five pending rewards through the app's storage envelope, reload, and confirm only four bubbles render and the oldest duplicate attribute displays the summed value. Tab to every bubble, verify the accessible name and focus ring, then repeat with reduced motion enabled and confirm no idle or flight motion occurs.

- [ ] **Step 7: Check console and screenshots**

Capture `375 x 812` and `402 x 874` screenshots. Confirm no overlap with title, character face, CTA, task rail, or navigation, and confirm the browser console has no new errors.

- [ ] **Step 8: Commit any verification-only fixes**

If fixes were required:

```bash
git add src/app.js src/styles.css tests
git commit -m "fix: refine growth bubble integration"
```

If no fixes were required, do not create an empty commit.
