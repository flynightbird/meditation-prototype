# Desktop Portfolio Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop-only Before/After portfolio presentation and five-video experience wall around the existing interactive mobile prototype while preserving the current mobile UI unchanged.

**Architecture:** Keep `#app.app-shell` as the only product instance. Wrap it in presentation markup that collapses with `display: contents` below `900px`, and isolate Before synchronization plus viewport-aware video playback in `src/portfolio-showcase.js`. Do not change the product state machine or existing navigation behavior.

**Tech Stack:** Vanilla HTML, CSS media queries and transforms, JavaScript ES modules, IntersectionObserver, Node.js built-in test runner, Playwright browser verification.

---

## File Map

- Create `assets/before-ai-coach.jpg` and `assets/before-private-trainer.jpg` from the supplied screenshots.
- Create `src/portfolio-showcase.js` for Before mapping, navigation synchronization, and viewport-aware playback.
- Create `tests/portfolio-showcase.test.js` for pure behavior tests.
- Modify `index.html` for the presentation shell and video wall.
- Modify `src/styles.css` for the mobile-transparent wrapper and desktop layout.
- Modify `src/app.js` only to initialize the controller.
- Modify `tests/visual-contract.test.js` for structural and responsive contracts.

The worktree contains unrelated uncommitted work. Do not reset, replace, or commit it. Repository policy requires explicit user authorization before any commit.

### Task 1: Add Assets and Failing Structural Contracts

**Files:**
- Create: `assets/before-ai-coach.jpg`
- Create: `assets/before-private-trainer.jpg`
- Modify: `tests/visual-contract.test.js`

- [ ] **Step 1: Copy the supplied screenshots without changing the originals**

```bash
cp "/Users/admin/Desktop/Weixin Image_20260803214832_188_117.jpg" assets/before-ai-coach.jpg
cp "/Users/admin/Desktop/Weixin Image_20260803214841_189_117.jpg" assets/before-private-trainer.jpg
file assets/before-ai-coach.jpg assets/before-private-trainer.jpg
```

Expected: both targets are valid JPEG images.

- [ ] **Step 2: Append failing contracts to `tests/visual-contract.test.js`**

```js
test("provides one interactive app inside a desktop portfolio shell", () => {
  assert.match(html, /class="portfolio-page"/);
  assert.match(html, /class="portfolio-hero"/);
  assert.match(html, /id="portfolioBeforeImage"/);
  assert.match(html, /class="device-frame"[\s\S]*<main class="app-shell" id="app"/);
  assert.equal((html.match(/id="app"/g) ?? []).length, 1);
});

test("uses both before assets and all five experience videos", () => {
  for (const name of ["before-ai-coach.jpg", "before-private-trainer.jpg"]) {
    assert.equal(existsSync(new URL(`../assets/${name}`, import.meta.url)), true);
  }
  for (const name of [
    "video-greeting.mp4",
    "video-meditation.mp4",
    "video-meditation-complete.mp4",
    "video-meal-prep.mp4",
    "video-meal-cook.mp4",
  ]) {
    assert.match(html, new RegExp(`assets/${name}`));
  }
});

test("keeps portfolio presentation desktop-only", () => {
  assert.match(css, /\.portfolio-page,\s*\.portfolio-hero[\s\S]*display:\s*contents/s);
  assert.match(css, /\.portfolio-before,\s*\.portfolio-videos[\s\S]*display:\s*none/s);
  assert.match(css, /@media \(min-width:\s*900px\)[\s\S]*\.portfolio-page\s*{[^}]*display:\s*block/s);
  assert.match(css, /@media \(min-width:\s*900px\)[\s\S]*\.portfolio-hero\s*{[^}]*min-height:\s*100dvh/s);
});

test("makes portfolio videos controllable and defers full loading", () => {
  const clips = html.match(/<video class="portfolio-video"[^>]*>/g) ?? [];
  assert.equal(clips.length, 5);
  for (const clip of clips) {
    assert.match(clip, /controls/);
    assert.match(clip, /muted/);
    assert.match(clip, /loop/);
    assert.match(clip, /playsinline/);
    assert.match(clip, /preload="metadata"/);
    assert.doesNotMatch(clip, /autoplay/);
  }
});
```

- [ ] **Step 3: Confirm the contracts fail for the missing presentation**

```bash
node --test tests/visual-contract.test.js
```

Expected: the new tests fail while prior tests retain their existing status.

### Task 2: Build the Responsive Presentation Structure

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`
- Test: `tests/visual-contract.test.js`

- [ ] **Step 1: Wrap the existing app in `index.html`**

Replace the opening body/main sequence with the following, then keep every existing child of `#app` unchanged:

```html
<body>
  <div class="portfolio-page">
    <section class="portfolio-hero" aria-labelledby="portfolioTitle">
      <p class="portfolio-outline" aria-hidden="true">BEFORE / AFTER</p>
      <h1 class="portfolio-heading" id="portfolioTitle">成长基地 · AI 健康体验</h1>
      <div class="portfolio-compare">
        <figure class="portfolio-before">
          <span class="portfolio-label">BEFORE / ORIGINAL UI</span>
          <span class="portfolio-paper" aria-hidden="true"></span>
          <img id="portfolioBeforeImage" src="./assets/before-ai-coach.jpg" alt="旧版 AI 教练页面" />
          <figcaption id="portfolioBeforeCaption" aria-live="polite">AI 教练 · 原始界面</figcaption>
        </figure>
        <div class="device-stage">
          <span class="portfolio-label portfolio-label-after">AFTER / INTERACTIVE</span>
          <div class="device-frame">
            <div class="device-sensor" aria-hidden="true"></div>
            <main class="app-shell" id="app" data-screen="recommendation">
```

- [ ] **Step 2: Close the device and add the first-screen video cue**

Immediately after the current `#app` closing content, use:

```html
            </main>
          </div>
        </div>
      </div>
      <a class="portfolio-peek" href="#experienceClips">
        <span><strong>05 个体验片段</strong> · 查看完整交互过程</span>
        <span class="portfolio-peek-arrow" aria-hidden="true"></span>
      </a>
    </section>
```

- [ ] **Step 3: Add the approved video wall**

```html
    <section class="portfolio-videos" id="experienceClips" aria-labelledby="experienceClipsTitle">
      <header class="portfolio-videos-header">
        <h2 id="experienceClipsTitle">体验片段</h2>
        <p>关键状态与完整交互过程</p>
      </header>
      <div class="portfolio-video-grid">
        <figure class="portfolio-clip"><video class="portfolio-video" src="./assets/video-greeting.mp4" muted loop playsinline controls preload="metadata"></video><figcaption>01 / 欢迎与进入</figcaption></figure>
        <figure class="portfolio-clip"><video class="portfolio-video" src="./assets/video-meditation.mp4" muted loop playsinline controls preload="metadata"></video><figcaption>02 / 冥想过程</figcaption></figure>
        <figure class="portfolio-clip"><video class="portfolio-video" src="./assets/video-meditation-complete.mp4" muted loop playsinline controls preload="metadata"></video><figcaption>03 / 完成反馈</figcaption></figure>
        <figure class="portfolio-clip"><video class="portfolio-video" src="./assets/video-meal-prep.mp4" muted loop playsinline controls preload="metadata"></video><figcaption>04 / 饮食准备</figcaption></figure>
        <figure class="portfolio-clip"><video class="portfolio-video" src="./assets/video-meal-cook.mp4" muted loop playsinline controls preload="metadata"></video><figcaption>05 / 烹饪行动</figcaption></figure>
      </div>
    </section>
  </div>
```

- [ ] **Step 4: Add mobile-transparent CSS before the existing media queries**

```css
.portfolio-page,
.portfolio-hero,
.portfolio-compare,
.device-stage,
.device-frame {
  display: contents;
}

.portfolio-before,
.portfolio-videos,
.portfolio-heading,
.portfolio-outline,
.portfolio-label,
.portfolio-peek,
.device-sensor {
  display: none;
}
```

- [ ] **Step 5: Add the desktop canvas, comparison, and video grid**

Append the full desktop block below. The scale is intentionally breakpoint-based so the logical `402×874` app remains intact and interactive.

```css
@media (min-width: 900px) {
  html, body { min-height: 100%; overflow: auto; overscroll-behavior: auto; background: #06070b; }
  body { display: block; color: #f4f5f8; }
  .portfolio-page {
    display: block;
    min-height: 100dvh;
    background:
      radial-gradient(ellipse 48% 46% at 0 0, rgba(90, 105, 164, .76), transparent 74%),
      radial-gradient(ellipse 42% 36% at 100% 88%, rgba(101, 115, 181, .82), transparent 72%),
      linear-gradient(124deg, #161a2c 0%, #07090f 48%, #030406 78%, #171b31 100%);
    background-attachment: fixed;
  }
  .portfolio-hero {
    --device-scale: .68;
    position: relative;
    display: grid;
    min-height: 100dvh;
    padding: 30px 6vw 32px;
    overflow: hidden;
    grid-template-rows: auto 1fr auto;
  }
  .portfolio-outline, .portfolio-heading, .portfolio-label, .portfolio-peek, .device-sensor { display: block; }
  .portfolio-outline {
    position: absolute; top: 12px; left: 6vw; margin: 0; color: transparent;
    font-size: clamp(42px, 5vw, 72px); font-weight: 800; line-height: 1;
    -webkit-text-stroke: 1px rgba(224, 230, 250, .22);
  }
  .portfolio-heading {
    position: relative; z-index: 2; margin: 30px 0 10px;
    font-size: clamp(26px, 2.6vw, 38px); font-weight: 700; line-height: 1.2; letter-spacing: 0;
  }
  .portfolio-compare {
    position: relative; z-index: 2; display: grid; width: min(100%, 1040px); min-height: 0; margin: auto;
    grid-template-columns: minmax(220px, 315px) auto; align-items: center; justify-content: center;
    gap: clamp(72px, 10vw, 150px);
  }
  .portfolio-before {
    position: relative; display: block; margin: 0;
    width: calc(402px * var(--device-scale)); height: calc(874px * var(--device-scale));
  }
  .device-stage {
    position: relative; display: block;
    width: calc(416px * var(--device-scale)); height: calc(888px * var(--device-scale));
  }
  .portfolio-paper {
    position: absolute; inset: 5% -9% -4% 8%; border: 1px solid rgba(255,255,255,.12);
    border-radius: 5px; background: rgba(116,128,174,.14); transform: rotate(-4deg);
  }
  .portfolio-before img {
    position: relative; display: block; width: 100%; height: 100%; object-fit: cover;
    border: 1px solid rgba(255,255,255,.2); border-radius: 7px;
    box-shadow: 0 28px 64px rgba(0,0,0,.46); transform: rotate(-1.5deg); transition: opacity 120ms ease;
  }
  .portfolio-before.is-switching img { opacity: 0; }
  .portfolio-before figcaption {
    position: absolute; right: 0; bottom: -24px; left: 0;
    color: rgba(230,234,246,.72); font-size: 11px; text-align: center;
  }
  .portfolio-label {
    position: absolute; z-index: 6; top: -16px; left: -20px; padding: 7px 10px;
    border: 1px solid rgba(255,255,255,.16); border-radius: 3px;
    color: #e7eaf5; background: rgba(8,9,14,.76);
    font: 700 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace; backdrop-filter: blur(8px);
  }
  .portfolio-label-after { right: -20px; left: auto; }
  .device-frame {
    position: relative; display: block; width: 416px; height: 888px; padding: 7px; overflow: hidden;
    border: 1px solid rgba(255,255,255,.15); border-radius: 28px;
    background: linear-gradient(145deg, #2a2d37, #08090d 45%, #232631);
    box-shadow: 0 34px 85px rgba(0,0,0,.64), 0 0 48px rgba(82,98,166,.12);
    transform: scale(var(--device-scale)); transform-origin: top left;
  }
  .device-frame .app-shell { width: 402px; height: 874px; max-height: none; border-radius: 21px; box-shadow: none; }
  .device-sensor {
    position: absolute; z-index: 80; top: 12px; left: 50%; width: 34%; height: 17px;
    border-radius: 10px; background: #07080b; transform: translateX(-50%); pointer-events: none;
  }
  .portfolio-peek {
    position: relative; z-index: 2; display: flex; width: min(100%, 1200px); margin: 6px auto 0;
    align-items: center; justify-content: space-between; color: #c1c6d7; font-size: 11px; text-decoration: none;
  }
  .portfolio-peek strong { color: #fff; }
  .portfolio-peek-arrow {
    width: 18px; height: 18px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor;
    transform: rotate(45deg) translate(-3px, 3px);
  }
  .portfolio-videos {
    display: block; min-height: 70dvh; padding: 40px 4vw 80px;
    border-top: 1px solid rgba(255,255,255,.08); background: rgba(3,4,7,.32);
  }
  .portfolio-videos-header {
    display: flex; width: min(100%, 1360px); margin: 0 auto 20px;
    align-items: end; justify-content: space-between;
  }
  .portfolio-videos-header h2, .portfolio-videos-header p { margin: 0; }
  .portfolio-videos-header h2 { font-size: 22px; }
  .portfolio-videos-header p { color: #989fb4; font-size: 12px; }
  .portfolio-video-grid {
    display: grid; width: min(100%, 1360px); margin: 0 auto;
    grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px;
  }
  .portfolio-clip {
    position: relative; overflow: hidden; margin: 0; border: 1px solid rgba(255,255,255,.12);
    border-radius: 6px; background: #11131b; box-shadow: 0 18px 42px rgba(0,0,0,.3);
  }
  .portfolio-video { display: block; width: 100%; aspect-ratio: 9 / 16; object-fit: cover; }
  .portfolio-clip figcaption {
    position: absolute; right: 0; bottom: 42px; left: 0; padding: 28px 12px 10px;
    color: #fff; background: linear-gradient(transparent, rgba(5,6,10,.86));
    font-size: 10px; font-weight: 700; pointer-events: none;
  }
}

@media (min-width: 900px) and (max-height: 780px) { .portfolio-hero { --device-scale: .55; } }
@media (min-width: 900px) and (min-height: 1000px) { .portfolio-hero { --device-scale: .78; } }
@media (min-width: 900px) and (max-width: 1180px) { .portfolio-video-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

- [ ] **Step 6: Add reduced-motion protection inside the existing reduced-motion query**

```css
.portfolio-before img { transition: none !important; }
```

- [ ] **Step 7: Run the focused contracts**

```bash
node --test tests/visual-contract.test.js
```

Expected: the new structure, asset, video, and responsive contracts pass.

### Task 3: Synchronize Before State and Control Video Playback

**Files:**
- Create: `src/portfolio-showcase.js`
- Create: `tests/portfolio-showcase.test.js`
- Modify: `src/app.js`
- Modify: `index.html`

- [ ] **Step 1: Write failing pure behavior tests**

Create `tests/portfolio-showcase.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { getBeforeState, shouldAutoplayPortfolioVideo } from "../src/portfolio-showcase.js";

test("maps only coach and trainer navigation to before states", () => {
  assert.deepEqual(getBeforeState("coach"), {
    src: "./assets/before-ai-coach.jpg",
    alt: "旧版 AI 教练页面",
    caption: "AI 教练 · 原始界面",
  });
  assert.deepEqual(getBeforeState("trainer"), {
    src: "./assets/before-private-trainer.jpg",
    alt: "旧版预约私教页面",
    caption: "预约私教 · 原始界面",
  });
  assert.equal(getBeforeState("skill"), null);
});

test("autoplays only intersecting desktop videos when motion is allowed", () => {
  assert.equal(shouldAutoplayPortfolioVideo({ isDesktop: true, reducedMotion: false, isIntersecting: true }), true);
  assert.equal(shouldAutoplayPortfolioVideo({ isDesktop: false, reducedMotion: false, isIntersecting: true }), false);
  assert.equal(shouldAutoplayPortfolioVideo({ isDesktop: true, reducedMotion: true, isIntersecting: true }), false);
  assert.equal(shouldAutoplayPortfolioVideo({ isDesktop: true, reducedMotion: false, isIntersecting: false }), false);
});
```

- [ ] **Step 2: Confirm the behavior tests fail**

```bash
node --test tests/portfolio-showcase.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/portfolio-showcase.js`.

- [ ] **Step 3: Implement `src/portfolio-showcase.js`**

```js
const BEFORE_STATES = {
  coach: {
    src: "./assets/before-ai-coach.jpg",
    alt: "旧版 AI 教练页面",
    caption: "AI 教练 · 原始界面",
  },
  trainer: {
    src: "./assets/before-private-trainer.jpg",
    alt: "旧版预约私教页面",
    caption: "预约私教 · 原始界面",
  },
};

export function getBeforeState(nav) {
  return BEFORE_STATES[nav] ?? null;
}

export function shouldAutoplayPortfolioVideo({ isDesktop, reducedMotion, isIntersecting }) {
  return isDesktop && !reducedMotion && isIntersecting;
}

export function setupPortfolioShowcase({ app, reducedMotion }) {
  const before = document.querySelector(".portfolio-before");
  const image = document.querySelector("#portfolioBeforeImage");
  const caption = document.querySelector("#portfolioBeforeCaption");
  const videos = [...document.querySelectorAll(".portfolio-video")];
  if (!before || !image || !caption) return () => {};

  let switchTimer = null;
  let activeNav = "coach";

  function applyBeforeState(next) {
    image.src = next.src;
    image.alt = next.alt;
    caption.textContent = next.caption;
  }

  function handleNavigation(event) {
    const button = event.target.closest('button[data-action="nav-tap"]');
    const next = getBeforeState(button?.dataset.nav);
    if (!next || button.dataset.nav === activeNav) return;
    activeNav = button.dataset.nav;
    window.clearTimeout(switchTimer);
    if (reducedMotion.matches) {
      applyBeforeState(next);
      return;
    }
    before.classList.add("is-switching");
    switchTimer = window.setTimeout(() => {
      applyBeforeState(next);
      before.classList.remove("is-switching");
    }, 120);
  }

  app.addEventListener("click", handleNavigation);
  const desktop = window.matchMedia("(min-width: 900px)");
  const visibleVideos = new WeakMap();

  function updateVideo(video, isIntersecting = visibleVideos.get(video) ?? false) {
    visibleVideos.set(video, isIntersecting);
    const shouldPlay = shouldAutoplayPortfolioVideo({
      isDesktop: desktop.matches,
      reducedMotion: reducedMotion.matches,
      isIntersecting,
    });
    if (shouldPlay) video.play().catch(() => {});
    else video.pause();
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => updateVideo(entry.target, entry.isIntersecting)),
    { rootMargin: "120px 0px", threshold: 0.15 },
  );
  videos.forEach((video) => observer.observe(video));

  function refreshVideos() {
    videos.forEach((video) => updateVideo(video));
  }

  desktop.addEventListener("change", refreshVideos);
  reducedMotion.addEventListener("change", refreshVideos);

  return () => {
    window.clearTimeout(switchTimer);
    app.removeEventListener("click", handleNavigation);
    observer.disconnect();
    desktop.removeEventListener("change", refreshVideos);
    reducedMotion.removeEventListener("change", refreshVideos);
    videos.forEach((video) => video.pause());
  };
}
```

- [ ] **Step 4: Initialize the controller in `src/app.js`**

Add at the top:

```js
import { setupPortfolioShowcase } from "./portfolio-showcase.js";
```

After the existing `render(false);` and `setupDailyWelcome();` calls, add:

```js
setupPortfolioShowcase({ app, reducedMotion });
```

Keep the current toast behavior unchanged:

```js
if (action === "nav-tap" && button.dataset.nav !== "coach") showToast("敬请期待");
```

- [ ] **Step 5: Refresh the module cache key in `index.html`**

```html
<script type="module" src="./src/app.js?v=20260803-portfolio"></script>
```

- [ ] **Step 6: Run focused behavior and contract tests**

```bash
node --test tests/portfolio-showcase.test.js tests/visual-contract.test.js
```

Expected: all focused tests pass.

### Task 4: Full Regression and Browser Verification

**Files:**
- Modify only if verification exposes a defect in the files already listed.
- Save verification screenshots under `artifacts/desktop-portfolio-showcase/`.

- [ ] **Step 1: Run the complete automated suite**

```bash
npm test
```

Expected: zero failures across existing and new tests.

- [ ] **Step 2: Check patch formatting**

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 3: Start the project**

```bash
npm start
```

Expected: `http://127.0.0.1:4173`. If occupied, run `python3 -m http.server 4174 --bind 127.0.0.1` and use port 4174.

- [ ] **Step 4: Verify mobile zero-regression at `375×812` and `402×874`**

Confirm all of the following with Playwright screenshots:

- portfolio heading, Before, labels, device decoration, and video wall are absent;
- `.app-shell` fills the viewport exactly as before;
- no new overflow appears;
- welcome, meditation, reward, meal, and bottom navigation remain interactive.

Save:

```text
artifacts/desktop-portfolio-showcase/mobile-375x812.png
artifacts/desktop-portfolio-showcase/mobile-402x874.png
```

- [ ] **Step 5: Verify desktop framing at `1280×720`, `1440×900`, and `1728×1117`**

Confirm the full device frame and bottom navigation are visible within the first screen, Before and After do not overlap, the video-section cue is visible, and the canvas matches the approved black/indigo reference.

Save:

```text
artifacts/desktop-portfolio-showcase/desktop-1280x720.png
artifacts/desktop-portfolio-showcase/desktop-1440x900.png
artifacts/desktop-portfolio-showcase/desktop-1728x1117.png
```

- [ ] **Step 6: Verify Before synchronization through the real app navigation**

1. Confirm the initial source ends with `before-ai-coach.jpg`.
2. Click the real right-side `预约私教` button.
3. Confirm the source ends with `before-private-trainer.jpg`.
4. Confirm the existing `敬请期待` toast still appears.
5. Click `AI教练` and confirm the first image returns.
6. Click `Skill` and confirm the current Before does not change.

Expected: synchronization is additive and never blocks current app behavior.

- [ ] **Step 7: Verify video behavior and accessibility**

Confirm videos play muted only near the viewport, pause when leaving it, remain controllable with native controls, and tolerate rejected autoplay. With `prefers-reduced-motion: reduce`, videos must not autoplay and Before must switch immediately. Verify keyboard focus reaches the video controls and first-screen anchor.

- [ ] **Step 8: Inspect the worktree without committing**

```bash
git status --short
git diff --stat
```

Expected: intended portfolio files plus the user's pre-existing changes. Do not commit without explicit authorization.
