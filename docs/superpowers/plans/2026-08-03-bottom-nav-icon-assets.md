# Bottom Navigation Icon Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace five bottom-navigation icon pairs with the approved SVG assets and add the enlarged, one-shot bouncing pony for the selected AI Coach tab.

**Architecture:** Store normalized, ASCII-named copies of the supplied SVGs in `assets/`. Render both off/on assets inside each affected navigation button and let the existing `.is-active` state choose the visible asset with CSS; keep the current robot as the AI off state and render the pony only for the AI active state. Use CSS-only motion and the existing reduced-motion media query, so no new navigation state or event handler is required.

**Tech Stack:** Static HTML, CSS animations, Node.js contract tests (`node:test`)

---

### Task 1: Import Assets And Lock The Mapping

**Files:**
- Create: `assets/nav-ai-coach-on.svg`
- Create: `assets/nav-trainer-off.svg`
- Create: `assets/nav-trainer-on.svg`
- Create: `assets/nav-skill-off.svg`
- Create: `assets/nav-skill-on.svg`
- Create: `assets/nav-plan-off.svg`
- Create: `assets/nav-plan-on.svg`
- Create: `assets/nav-points-off.svg`
- Create: `assets/nav-points-on.svg`
- Create: `assets/nav-mine-off.svg`
- Create: `assets/nav-mine-on.svg`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Write the failing asset contract test**

Add a test that defines the exact destination names and verifies each copied SVG keeps the approved source bytes without depending on the local Desktop after import:

```js
test("ships the approved bottom navigation SVG assets without recoloring", () => {
  const approved = new Map([
    ["nav-ai-coach-on.svg", "1ae101f78fb046d1280a9b551f00b2309be547f66d34fd40a6af8f0f4bd28f26"],
    ["nav-trainer-off.svg", "52858b7355d5cee63d4d77cc464c02821632955f08741daea40dc3ed875988af"],
    ["nav-trainer-on.svg", "b4c0008ae968d164cd7fba3fcf8542e7365033f1af0431e94933bbfa710718a2"],
    ["nav-skill-off.svg", "d42631ff42948148e24ad25c3ec77b25727ab05ab474a3dcf304f8f1ddc60ae4"],
    ["nav-skill-on.svg", "53e61ffef87d348ba19de13cbc59fe95662ce984399d1d8d3ed116c5192ffe26"],
    ["nav-plan-off.svg", "ea44f6223498aa381418229b8004c68e3f0b1cf95752e65c8057645b0c9908f6"],
    ["nav-plan-on.svg", "cfadaafac3de9f050c3b71074c0af4bd836e9b7b0d0035381d294ba9d2225ff0"],
    ["nav-points-off.svg", "bd4e71da0691269a3557bc02db0c45b41068f787aaaf931bf9925aac7719317a"],
    ["nav-points-on.svg", "6cc81758d8717c6c177f5a6d7e865c3e79a33de8b070607c869b8825f8ffffca"],
    ["nav-mine-off.svg", "294cf28ba25588c0a329f57cfa869b06a2dedaee2fa3b56aaf4d85f16a796edb"],
    ["nav-mine-on.svg", "09bb7298bf5afd9568e172134a965d668a2d20f69724dbd9470fd048a6eb5216"],
  ]);

  for (const [destination, expectedHash] of approved) {
    const contents = readFileSync(new URL(`../assets/${destination}`, import.meta.url));
    assert.equal(
      createHash("sha256").update(contents).digest("hex"),
      expectedHash,
    );
  }
});
```

Import `createHash` from `node:crypto` and `readFileSync` from `node:fs` if the test file does not already import them.

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL with `ENOENT` for `assets/nav-ai-coach-on.svg`.

- [ ] **Step 3: Copy the approved SVGs without modifying their contents**

Run:

```bash
cp /Users/admin/Desktop/AI教练.svg assets/nav-ai-coach-on.svg
cp /Users/admin/Desktop/约教练-off.svg assets/nav-trainer-off.svg
cp /Users/admin/Desktop/约教练-on.svg assets/nav-trainer-on.svg
cp /Users/admin/Desktop/skill-off.svg assets/nav-skill-off.svg
cp /Users/admin/Desktop/skill-on.svg assets/nav-skill-on.svg
cp /Users/admin/Desktop/健身计划-off.svg assets/nav-plan-off.svg
cp /Users/admin/Desktop/健身计划-on.svg assets/nav-plan-on.svg
cp /Users/admin/Desktop/积分-off.svg assets/nav-points-off.svg
cp /Users/admin/Desktop/积分-on.svg assets/nav-points-on.svg
cp /Users/admin/Desktop/我的-off.svg assets/nav-mine-off.svg
cp /Users/admin/Desktop/我的-on.svg assets/nav-mine-on.svg
```

- [ ] **Step 4: Run the contract test and verify it passes**

Run: `node --test tests/visual-contract.test.js`

Expected: all visual contract tests pass.

- [ ] **Step 5: Commit the asset import**

```bash
git add assets/nav-*.svg tests/visual-contract.test.js
git commit -m "assets: add bottom navigation icon states"
```

### Task 2: Render Off And On Navigation States

**Files:**
- Modify: `index.html:103-168`
- Modify: `src/styles.css:903-959`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Write failing markup and style contract tests**

Add assertions for all destination assets and the state selectors:

```js
test("renders paired SVG states for the five standard navigation items", () => {
  for (const name of ["trainer", "skill", "plan", "points", "mine"]) {
    assert.match(html, new RegExp(`nav-${name}-off\\.svg`));
    assert.match(html, new RegExp(`nav-${name}-on\\.svg`));
  }
  assert.match(css, /\.nav-state-icon\.is-on\s*{[^}]*opacity:\s*0/s);
  assert.match(css, /\.nav-item\.is-active \.nav-state-icon\.is-off\s*{[^}]*opacity:\s*0/s);
  assert.match(css, /\.nav-item\.is-active \.nav-state-icon\.is-on\s*{[^}]*opacity:\s*1/s);
});

test("uses the pony only for the selected AI coach state", () => {
  assert.match(html, /data-nav="coach"[\s\S]*nav-ai-coach-on\.svg/);
  assert.match(css, /data-nav="coach"[^}]*\.nav-icon[^}]*width:\s*44px/s);
  assert.match(css, /data-nav="coach"[^}]*\.nav-label[^}]*clip-path:\s*inset\(50%\)/s);
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because the paired image markup and state selectors do not exist.

- [ ] **Step 3: Replace the five inline SVGs with paired images**

For trainer, skill, plan, points, and mine, use the corresponding names from Task 1:

```html
<span class="nav-icon" aria-hidden="true">
  <img class="nav-state-icon is-off" src="./assets/nav-trainer-off.svg" alt="" />
  <img class="nav-state-icon is-on" src="./assets/nav-trainer-on.svg" alt="" />
</span>
```

Keep each existing `.nav-label` unchanged. Repeat with `skill`, `plan`, `points`, and `mine` asset names.

- [ ] **Step 4: Add the pony beside the existing robot**

Keep the existing robot SVG as the AI off state and add the active asset:

```html
<span class="nav-icon" aria-hidden="true">
  <svg class="nav-state-icon is-off nav-coach-robot" ...>...</svg>
  <img class="nav-state-icon is-on nav-coach-pony" src="./assets/nav-ai-coach-on.svg" alt="" />
</span>
<span class="nav-label">AI教练</span>
```

- [ ] **Step 5: Implement sizing, state crossfade, and accessible label hiding**

Update the navigation styles:

```css
.nav-icon {
  position: relative;
  width: 28px;
  height: 28px;
}

.nav-state-icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 1;
  transition: opacity 140ms ease;
}

.nav-state-icon.is-on { opacity: 0; }
.nav-item.is-active .nav-state-icon.is-off { opacity: 0; }
.nav-item.is-active .nav-state-icon.is-on { opacity: 1; }

.nav-item[data-nav="coach"].is-active .nav-icon {
  width: 44px;
  height: 44px;
}

.nav-item[data-nav="coach"].is-active .nav-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

Keep the existing selected-label and selected-indicator rules for the five standard items.

- [ ] **Step 6: Run the contract test and verify it passes**

Run: `node --test tests/visual-contract.test.js`

Expected: all visual contract tests pass.

- [ ] **Step 7: Commit navigation rendering**

```bash
git add index.html src/styles.css tests/visual-contract.test.js
git commit -m "feat: replace bottom navigation icons"
```

### Task 3: Add The One-Shot Pony Bounce And Verify The UI

**Files:**
- Modify: `src/styles.css:928-959`
- Modify: `src/styles.css:1690-1730`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Write the failing motion contract test**

```js
test("bounces the selected AI coach pony once and respects reduced motion", () => {
  assert.match(css, /\.nav-item\[data-nav="coach"\]\.is-active \.nav-coach-pony\s*{[^}]*animation:\s*nav-coach-bounce 420ms/s);
  assert.match(css, /@keyframes nav-coach-bounce[\s\S]*scale\(0\.82\)[\s\S]*scale\(1\.08\)[\s\S]*scale\(1\)/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.nav-state-icon[\s\S]*transition:\s*none/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.nav-coach-pony[\s\S]*animation:\s*none/s);
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `node --test tests/visual-contract.test.js`

Expected: FAIL because `nav-coach-bounce` is not defined.

- [ ] **Step 3: Add the one-shot animation and reduced-motion rules**

```css
.nav-item[data-nav="coach"].is-active .nav-coach-pony {
  animation: nav-coach-bounce 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center;
}

@keyframes nav-coach-bounce {
  0% { transform: scale(0.82); }
  62% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .nav-state-icon { transition: none; }
  .nav-coach-pony { animation: none !important; }
}
```

The animation naturally restarts only when `.is-active` is removed and later reapplied by the existing navigation handler.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/visual-contract.test.js
npm test
git diff --check
```

Expected: all tests pass and `git diff --check` prints no output.

- [ ] **Step 5: Verify both mobile viewports in a real browser**

At `375×812` and `402×874`:

- Confirm each standard item swaps between the exact off/on SVGs.
- Confirm AI selected state shows a centered 44px pony with no visible label.
- Confirm the 47.5px bounce peak stays inside the 54px indicator height and does not overlap adjacent items.
- Confirm switching away restores the robot and “AI教练” label.
- Confirm the button accessible name remains “AI教练”.
- Confirm the browser console has no new warnings or errors.

- [ ] **Step 6: Commit the motion and verification contracts**

```bash
git add src/styles.css tests/visual-contract.test.js
git commit -m "style: animate selected AI coach icon"
```
