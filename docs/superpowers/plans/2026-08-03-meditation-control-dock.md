# Meditation Control Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active meditation text controls with two independent circular icon buttons on a full-width dock matching the existing bottom navigation surface.

**Architecture:** Keep the existing `pause` and `end` actions and state machine unchanged. Render state-dependent icon markup in `src/app.js`, keep all presentation in `src/styles.css`, and protect the agreed visual and accessibility contract with the existing source-level Node test suite.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js test runner, agent-browser.

---

### Task 1: Define the control contract

**Files:**
- Modify: `tests/visual-contract.test.js:107`
- Modify: `tests/visual-contract.test.js:181`

- [ ] **Step 1: Replace the obsolete joined-control assertions with a failing icon-button contract**

Add assertions that require `pause.svg`, `play.svg`, and `stop.svg`; state-dependent Chinese `aria-label` values; `64px` circular buttons; a `12px` gap; and a full-width `110px` dock using the existing navigation surface values:

```js
test("uses independent icon controls on a navigation-style meditation dock", () => {
  assert.match(app, /aria-label="\$\{state\.isPaused \? "继续冥想" : "暂停冥想"\}"/);
  assert.match(app, /src="\.\/assets\/\$\{state\.isPaused \? "play" : "pause"\}\.svg"/);
  assert.match(app, /data-action="end" aria-label="结束冥想"/);
  assert.match(app, /src="\.\/assets\/stop\.svg"/);
  assert.match(css, /\.session-controls\s*{[^}]*width:\s*100%[^}]*height:\s*110px[^}]*gap:\s*12px/s);
  assert.match(css, /\.session-controls\s*{[^}]*border-top:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)[^}]*border-radius:\s*22px 22px 0 0/s);
  assert.match(css, /\.session-controls\s*{[^}]*background:\s*rgba\(20,\s*13,\s*9,\s*0\.72\)[^}]*backdrop-filter:\s*blur\(18px\) saturate\(1\.2\)/s);
  assert.match(css, /\.session-control\s*{[^}]*width:\s*64px[^}]*height:\s*64px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.session-control img\s*{[^}]*width:\s*24px[^}]*height:\s*24px/s);
});
```

Update the compact-control test so it no longer expects `min-height: 46px` on session buttons.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="navigation-style meditation dock" tests/visual-contract.test.js`

Expected: FAIL because the old text buttons and joined pill styles do not satisfy the new contract.

### Task 2: Add the approved SVG assets

**Files:**
- Create: `assets/pause.svg`
- Create: `assets/play.svg`
- Create: `assets/stop.svg`

- [ ] **Step 1: Copy the user-provided source assets without modifying their paths or geometry**

Run:

```bash
cp /Users/admin/Desktop/pause.svg assets/pause.svg
cp /Users/admin/Desktop/play.svg assets/play.svg
cp /Users/admin/Desktop/stop.svg assets/stop.svg
```

Expected: all three files exist under `assets/` and remain `24 × 24` SVGs with black paths.

- [ ] **Step 2: Verify the assets are readable and referenced names are exact**

Run: `rg -n 'width="24" height="24"|fill="black"' assets/pause.svg assets/play.svg assets/stop.svg`

Expected: matches in all three files.

### Task 3: Render state-aware icon controls

**Files:**
- Modify: `src/app.js:387`

- [ ] **Step 1: Replace text button contents with the minimal icon markup**

Use the existing state and actions:

```js
actionZone.innerHTML = `
  <div class="session-controls" role="group" aria-label="冥想控制">
    <button class="session-control session-control-primary" data-action="pause" aria-label="${state.isPaused ? "继续冥想" : "暂停冥想"}" aria-pressed="${state.isPaused}">
      <img src="./assets/${state.isPaused ? "play" : "pause"}.svg" alt="" aria-hidden="true" />
    </button>
    <button class="session-control session-control-secondary" data-action="end" aria-label="结束冥想">
      <img src="./assets/stop.svg" alt="" aria-hidden="true" />
    </button>
  </div>`;
```

- [ ] **Step 2: Run the focused test and confirm markup assertions pass while CSS assertions still fail**

Run: `node --test --test-name-pattern="navigation-style meditation dock" tests/visual-contract.test.js`

Expected: FAIL on the first missing dock CSS assertion, with icon and accessibility assertions passing.

### Task 4: Implement the full-width dock and independent buttons

**Files:**
- Modify: `src/styles.css:800`
- Modify: `src/styles.css:1243`

- [ ] **Step 1: Replace the joined pill styles with the approved dock and circles**

Implement the agreed values:

```css
.session-controls {
  display: flex;
  width: 100%;
  height: 110px;
  padding: 16px 16px max(16px, env(safe-area-inset-bottom));
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px 22px 0 0;
  background: rgba(20, 13, 9, 0.72);
  backdrop-filter: blur(18px) saturate(1.2);
}

.session-control {
  display: grid;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--ink);
  box-shadow: 0 6px 16px rgba(30, 15, 8, 0.2);
  cursor: pointer;
  transition: transform 140ms ease, filter 140ms ease;
}

.session-control-primary { background: #ffd42a; }
.session-control-secondary { background: #fff; }
.session-control img { width: 24px; height: 24px; display: block; }
.session-control:active { transform: scale(0.96); filter: brightness(0.96); }
```

Set the active `.action-zone` to `right: 0; bottom: 0; left: 0;` so the dock spans the app shell while other screens retain their current action-zone inset.

- [ ] **Step 2: Run the focused test and verify GREEN**

Run: `node --test --test-name-pattern="navigation-style meditation dock" tests/visual-contract.test.js`

Expected: PASS.

- [ ] **Step 3: Run the full automated suite**

Run: `npm test`

Expected: all tests pass with no errors or warnings.

### Task 5: Verify the interaction and responsive presentation

**Files:**
- Create: `artifacts/meditation-control-dock-402x874.png`
- Create: `artifacts/meditation-control-dock-paused-402x874.png`
- Create: `artifacts/meditation-control-dock-375x812.png`

- [ ] **Step 1: Start the local app and open it through agent-browser**

Run: `npm start`

Expected: server is available at `http://127.0.0.1:4173`.

- [ ] **Step 2: Verify the 402 × 874 active and paused states**

Use agent-browser to set the viewport, open the page, snapshot, click `开始冥想`, and capture the active state. Click the pause button, re-snapshot, confirm its accessible name becomes `继续冥想` and its image source ends with `play.svg`, then capture the paused state.

Expected: dock is full width and bottom-aligned; both circles are `64px`; buttons and timer do not overlap; pause/continue state changes correctly.

- [ ] **Step 3: Verify the 375 × 812 active state**

Set the viewport to `375 × 812`, reload, enter meditation, and capture the active state.

Expected: the dock remains full width, safe-area padding remains valid, labels do not appear visually, and controls stay centered without clipping.

- [ ] **Step 4: Verify stopping still follows the existing completion flow**

Click the button named `结束冥想`, re-snapshot, and confirm the active controls disappear and the completion state begins.

Expected: no regression in the existing `end` action flow.

### Task 6: Review the final diff

**Files:**
- Review: `assets/pause.svg`
- Review: `assets/play.svg`
- Review: `assets/stop.svg`
- Review: `src/app.js`
- Review: `src/styles.css`
- Review: `tests/visual-contract.test.js`

- [ ] **Step 1: Confirm scope and preserve unrelated user changes**

Run: `git diff -- src/app.js src/styles.css tests/visual-contract.test.js assets/pause.svg assets/play.svg assets/stop.svg`

Expected: only the meditation control contract, markup, styles, and three assets are added; existing unrelated edits in `src/styles.css` and `tests/visual-contract.test.js` remain intact.

- [ ] **Step 2: Report verification evidence without committing**

Do not create a commit because repository policy requires an explicit user request. Report the passing test count, both viewport checks, interaction checks, and artifact paths.
