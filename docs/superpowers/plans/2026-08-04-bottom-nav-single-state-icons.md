# Bottom Navigation Single-State Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the booking icon, remove duplicate selected-state assets for tabs two through six, tint selected icons `#FFD32C`, and reduce those icons to `22px` without changing the AI coach treatment or dock layout.

**Architecture:** Standard navigation items use one SVG silhouette each through a CSS mask element whose background color changes with active state. The AI coach keeps the existing paired robot/pony rendering and animation. Visual contract tests own the exact asset hash, removed-file contract, markup shape, dimensions, and selected color.

**Tech Stack:** Static HTML, CSS masks, SVG assets, Node.js built-in test runner.

---

### Task 1: Define The Single-State Icon Contract

**Files:**
- Modify: `tests/visual-contract.test.js:10-53`

- [ ] **Step 1: Replace the paired-asset tests with failing single-state tests**

Replace the current bottom navigation asset and paired-state tests with:

```js
test("ships the approved single-state bottom navigation SVG assets", () => {
  const approved = new Map([
    ["nav-ai-coach-on.svg", "1ae101f78fb046d1280a9b551f00b2309be547f66d34fd40a6af8f0f4bd28f26"],
    ["nav-trainer-off.svg", "8fb1dde612b12b8e69f062570eef687288f244be0197d6e2e0772f753de3f8dd"],
    ["nav-skill-off.svg", "d42631ff42948148e24ad25c3ec77b25727ab05ab474a3dcf304f8f1ddc60ae4"],
    ["nav-plan-off.svg", "ea44f6223498aa381418229b8004c68e3f0b1cf95752e65c8057645b0c9908f6"],
    ["nav-points-off.svg", "bd4e71da0691269a3557bc02db0c45b41068f787aaaf931bf9925aac7719317a"],
    ["nav-mine-off.svg", "294cf28ba25588c0a329f57cfa869b06a2dedaee2fa3b56aaf4d85f16a796edb"],
  ]);

  for (const [destination, expectedHash] of approved) {
    const contents = readFileSync(new URL(`../assets/${destination}`, import.meta.url));
    assert.equal(createHash("sha256").update(contents).digest("hex"), expectedHash);
  }

  for (const name of ["trainer", "skill", "plan", "points", "mine"]) {
    assert.equal(existsSync(new URL(`../assets/nav-${name}-on.svg`, import.meta.url)), false);
    assert.doesNotMatch(html, new RegExp(`nav-${name}-on\\.svg`));
  }
});

test("renders compact mask-backed standard navigation icons", () => {
  for (const name of ["trainer", "skill", "plan", "points", "mine"]) {
    assert.match(
      html,
      new RegExp(`data-nav="${name}"[\\s\\S]*class="nav-standard-icon"[\\s\\S]*--nav-icon: url\\(\\.\\/assets\\/nav-${name}-off\\.svg\\)`),
    );
  }
  assert.match(css, /\.nav-standard-icon\s*{[^}]*width:\s*22px[^}]*height:\s*22px[^}]*mask-image:\s*var\(--nav-icon\)/s);
  assert.match(css, /\.nav-item\.is-active \.nav-standard-icon\s*{[^}]*background:\s*#FFD32C/s);
});
```

Keep the existing AI coach pony and reduced-motion tests unchanged.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: FAIL because the trainer hash is still the old value, `-on.svg` files still exist, mask markup is absent, and compact mask CSS is absent.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/visual-contract.test.js
git commit -m "test: define compact navigation icon states"
```

### Task 2: Replace Assets And Render One Standard Icon State

**Files:**
- Modify: `assets/nav-trainer-off.svg`
- Delete: `assets/nav-trainer-on.svg`
- Delete: `assets/nav-skill-on.svg`
- Delete: `assets/nav-plan-on.svg`
- Delete: `assets/nav-points-on.svg`
- Delete: `assets/nav-mine-on.svg`
- Modify: `index.html:120-152`
- Modify: `src/styles.css:928-978`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Replace the trainer off asset with the supplied SVG**

Set `assets/nav-trainer-off.svg` to the exact contents of `/Users/admin/Desktop/约教练-off.svg`. Confirm the copied file hash:

```bash
shasum -a 256 assets/nav-trainer-off.svg
```

Expected hash: `8fb1dde612b12b8e69f062570eef687288f244be0197d6e2e0772f753de3f8dd`.

- [ ] **Step 2: Delete the five standard selected-state assets**

Delete these exact files:

```text
assets/nav-trainer-on.svg
assets/nav-skill-on.svg
assets/nav-plan-on.svg
assets/nav-points-on.svg
assets/nav-mine-on.svg
```

Do not delete `assets/nav-ai-coach-on.svg`.

- [ ] **Step 3: Replace paired image markup with one mask element**

For each standard navigation item, replace both `<img>` elements with one span. Use these exact declarations:

```html
<span class="nav-standard-icon" style="--nav-icon: url(../assets/nav-trainer-off.svg)"></span>
<span class="nav-standard-icon" style="--nav-icon: url(../assets/nav-skill-off.svg)"></span>
<span class="nav-standard-icon" style="--nav-icon: url(../assets/nav-plan-off.svg)"></span>
<span class="nav-standard-icon" style="--nav-icon: url(../assets/nav-points-off.svg)"></span>
<span class="nav-standard-icon" style="--nav-icon: url(../assets/nav-mine-off.svg)"></span>
```

Keep each declaration inside its existing `.nav-icon` wrapper and do not modify the coach markup. The `../assets` prefix is required because the custom-property URL resolves relative to `src/styles.css`, where `mask-image` consumes it.

- [ ] **Step 4: Add compact mask styling and scope paired-state rules to the coach**

Keep `.nav-icon` at `28px` so the coach geometry remains stable. Add:

```css
.nav-standard-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 22px;
  height: 22px;
  background: rgba(255, 248, 239, 0.72);
  mask-image: var(--nav-icon);
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  transform: translate(-50%, -50%);
  transition: background 140ms ease;
  -webkit-mask-image: var(--nav-icon);
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

.nav-item.is-active .nav-standard-icon {
  background: #FFD32C;
}
```

Restrict existing `.nav-state-icon` opacity-switching rules to the coach elements, or leave them generic only if they no longer match any standard icon. Do not change the dock capsule or coach sizing declarations.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/visual-contract.test.js
```

Expected: all visual contract tests PASS.

- [ ] **Step 6: Commit the implementation**

```bash
git add assets/nav-ai-coach-on.svg assets/nav-trainer-off.svg assets/nav-skill-off.svg assets/nav-plan-off.svg assets/nav-points-off.svg assets/nav-mine-off.svg index.html src/styles.css tests/visual-contract.test.js
git add -u assets
git commit -m "style: compact bottom navigation icons"
```

### Task 3: Verify The Integrated Navigation

**Files:**
- Verify: `index.html`
- Verify: `src/styles.css`
- Verify: `assets/nav-*.svg`
- Verify: `tests/visual-contract.test.js`

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Check repository hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no uncommitted files.

- [ ] **Step 3: Verify mobile rendering in a real browser**

Open the home and trainer views at `375x812` and `402x874`. Confirm:

- items two through six are optically consistent at `22px`;
- the supplied booking icon is visible and not clipped;
- selecting trainer changes its icon to exact yellow while retaining the sliding capsule;
- inactive icons remain neutral;
- the AI coach pony, label behavior, and bounce are unchanged;
- the dock remains full width with `8px` padding and `32px` top corners.

- [ ] **Step 4: Record final verification evidence**

Capture the final test count, `git diff --check` exit status, mobile viewport results, and final commit IDs in the handoff. Do not claim completion without those fresh results.
