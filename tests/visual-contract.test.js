import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const growthStatsModel = readFileSync(new URL("../src/growth-stats.js", import.meta.url), "utf8");

function getBraceBlock(source, startToken) {
  const start = source.indexOf(startToken);
  if (start === -1) return null;

  const open = source.indexOf("{", start + startToken.length);
  if (open === -1) return null;

  return getBraceBlockAt(source, open, start);
}

function getBraceBlockAt(source, open, start = open) {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  return null;
}

function getCssRule(source, selector) {
  const normalizedSelector = selector.trim().replace(/\s+/g, " ");
  let headerStart = 0;

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "{") {
      const header = source.slice(headerStart, index).trim();
      const selectors = header.split(",").map((item) => item.trim().replace(/\s+/g, " "));
      const block = getBraceBlockAt(source, index, headerStart);
      if (selectors.includes(normalizedSelector) && block) return { selectors, block };
      headerStart = index + 1;
    } else if (source[index] === "}") {
      headerStart = index + 1;
    }
  }

  return null;
}

function getMarkup(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "");
}

function getOpeningTags(source, tagName = "[a-z][\\w:-]*") {
  return getMarkup(source).match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function getElementBlock(source, openingTag) {
  const markup = getMarkup(source);
  const start = markup.indexOf(openingTag);
  const name = openingTag.match(/^<([a-z][\w:-]*)\b/i)?.[1];
  if (start === -1 || !name) return null;

  const tags = new RegExp(`<\\/?${name}\\b[^>]*>`, "gi");
  tags.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tags.exec(markup))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return markup.slice(start, tags.lastIndex);
  }

  return null;
}

function getAttribute(tag, name) {
  const attribute = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`(?:^|\\s)${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`, "i"));
  return match ? match[1] ?? match[2] ?? match[3] : null;
}

function hasBooleanAttribute(tag, name) {
  const attribute = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\s${attribute}(?=\\s|=|/?>)`, "i").test(tag);
}

function hasClass(tag, className) {
  return (getAttribute(tag, "class") ?? "").split(/\s+/).includes(className);
}

test("ships the approved single-state bottom navigation assets", () => {
  const approved = new Map([
    ["nav-ai-coach-off.png", "627b5c8e8269452bb37e37c37d4d5aeda08df768520ede619606244c744fecf6"],
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
      new RegExp(`data-nav="${name}"[\\s\\S]*class="nav-standard-icon"[\\s\\S]*--nav-icon: url\\(\\.\\.\\/assets\\/nav-${name}-off\\.svg\\)`),
    );
  }
  assert.match(css, /\.nav-standard-icon\s*{[^}]*width:\s*22px[^}]*height:\s*22px[^}]*mask-image:\s*var\(--nav-icon\)/s);
  assert.match(css, /\.nav-item\.is-active \.nav-standard-icon\s*{[^}]*background:\s*#FFD32C/s);
});

test("balances standard navigation icons against the unselected AI coach", () => {
  assert.match(
    css,
    /\.nav-item:not\(\[data-nav="coach"\]\) \.nav-icon\s*{[^}]*flex-basis:\s*22px[^}]*width:\s*22px[^}]*height:\s*22px/s,
  );
  assert.match(
    css,
    /\.nav-item:not\(\[data-nav="coach"\]\) \.nav-state-icon\s*{[^}]*inset:\s*1px[^}]*width:\s*20px[^}]*height:\s*20px/s,
  );
});

test("uses the pony only for the selected AI coach state", () => {
  assert.match(html, /data-nav="coach"[\s\S]*class="nav-state-icon is-off nav-coach-off"[^>]*nav-ai-coach-off\.png[\s\S]*nav-ai-coach-on\.svg/);
  assert.match(css, /\.nav-coach-off\s*{[^}]*width:\s*22px[^}]*height:\s*22px/s);
  assert.match(css, /data-nav="coach"[^}]*\.nav-icon[^}]*width:\s*44px[^}]*height:\s*44px/s);
  assert.match(css, /data-nav="coach"[^}]*\.nav-label[^}]*clip-path:\s*inset\(50%\)/s);
});

test("bounces the selected AI coach pony once and respects reduced motion", () => {
  assert.match(css, /\.nav-item\[data-nav="coach"\]\.is-active \.nav-coach-pony\s*{[^}]*animation:\s*nav-coach-bounce 420ms/s);
  assert.match(css, /@keyframes nav-coach-bounce[\s\S]*scale\(0\.82\)[\s\S]*scale\(1\.08\)[\s\S]*scale\(1\)/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.nav-state-icon\s*{[^}]*transition:\s*none/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.nav-coach-pony\s*{[^}]*animation:\s*none/s);
});

test("uses video as the only large IP carrier", () => {
  assert.doesNotMatch(html, /class="character-stage"|id="character"/);
  assert.doesNotMatch(app, /assets\/ip-(lift|meditate|stretch|walk)\.png/);
  for (const name of ["ip-lift.png", "ip-meditate.png", "ip-stretch.png", "ip-walk.png"]) {
    assert.equal(
      existsSync(new URL(`../assets/${name}`, import.meta.url)),
      false,
      `${name} should be removed`,
    );
  }
});

test("declares an existing favicon so browser startup has no missing resource", () => {
  const faviconTag = getOpeningTags(html, "link").find(
    (tag) => (getAttribute(tag, "rel") ?? "").split(/\s+/).includes("icon"),
  );

  assert.ok(faviconTag, "document should declare a favicon");
  const href = getAttribute(faviconTag, "href");
  assert.ok(href?.startsWith("./assets/"), "favicon should use a local asset");
  assert.equal(existsSync(new URL(`../${href.slice(2)}`, import.meta.url)), true);
});

test("versions the stylesheet so static previews do not retain stale CSS", () => {
  const stylesheetTag = getOpeningTags(html, "link").find(
    (tag) => (getAttribute(tag, "rel") ?? "").split(/\s+/).includes("stylesheet"),
  );

  assert.ok(stylesheetTag);
  assert.equal(getAttribute(stylesheetTag, "href"), "./src/styles.css?v=20260804-growth-stats");
});

test("provides one reusable full-screen media layer", () => {
  assert.match(html, /<video[^>]*id="sceneVideo"[^>]*playsinline/);
  assert.doesNotMatch(html, /<video[^>]*id="sceneVideo"[^>]*muted/);
  assert.match(html, /id="mediaTransition"/);
});

test("provides an inert hidden next-scene preloader", () => {
  assert.match(
    html,
    /<video[^>]*id="scenePreloader"[^>]*muted[^>]*playsinline[^>]*preload="auto"[^>]*hidden[^>]*aria-hidden="true"[^>]*tabindex="-1"/,
  );
  assert.match(app, /const scenePreloader = document\.querySelector\("#scenePreloader"\)/);
  assert.match(
    app,
    /syncPreloadSource\(scenePreloader, getNextMediaSource\(state\.screen\)\)/,
  );
});

test("keeps reward claiming separate from the persistent room object", () => {
  assert.match(html, /id="claimReward"[^>]*data-action="claim-reward"/);
  assert.match(html, /class="claim-label">点击领取/);
  assert.match(html, /id="rewardObject"[^>]*data-action="object-detail"/);
});

test("defers reward artwork until the completion scene", () => {
  const deferred = html.match(/data-deferred-src="\.\/assets\/reward-bed\.png"/g) ?? [];
  assert.equal(deferred.length, 3);
  assert.doesNotMatch(
    html,
    /<img(?=[^>]*reward-bed\.png)[^>]*\ssrc="\.\/assets\/reward-bed\.png"/,
  );
  assert.match(
    app,
    /state\.screen === "completion"[\s\S]*ensureRewardImages\(\)/,
  );
});

test("renders the approved meal preparation and meal-time actions", () => {
  assert.match(app, /晚餐正在准备中/);
  assert.match(app, /17:30 提醒我/);
  assert.match(app, /晚餐时间到了/);
  assert.match(app, /我开动了/);
  assert.match(app, /src="\.\/assets\/icon-bell\.svg"/);
  assert.match(app, /src="\.\/assets\/icon-utensils\.svg"/);
});

test("handles completion, manual claiming, and presenter-controlled meal time", () => {
  assert.match(app, /COMPLETION_VIDEO_ENDED/);
  assert.match(app, /CLAIM_REWARD/);
  assert.match(app, /SET_MEAL_REMINDER/);
  assert.match(app, /DEMO_TIME_REACHED/);
  assert.match(app, /START_MEAL/);
  assert.match(app, /state\.screen === "active" && state\.isPaused[\s\S]*sceneVideo\.pause\(\)/);
  assert.doesNotMatch(app, /highFiveHapticFired|sceneVideo\.currentTime >= 6\.7/);
  assert.match(app, /claimReward\.setAttribute\("aria-hidden"/);
});

test("synchronizes the meditation timer with actual video playback", () => {
  assert.match(app, /sceneVideo\.addEventListener\("playing", setTimerRunning\)/);
  assert.match(app, /mediaReady:\s*sceneVideo\.readyState\s*>=\s*HTMLMediaElement\.HAVE_CURRENT_DATA/);
  assert.match(app, /classList\.toggle\("is-timer-running"/);
  assert.match(app, /COUNTDOWN_COMPLETE/);
  assert.match(app, /countdownCompleteTimer\s*=\s*window\.setTimeout[\s\S]*300/s);
});

test("renders a rounded clockwise SVG meditation timer", () => {
  assert.match(app, /class="timer-track"[^>]*stroke-dasharray="2 3"/);
  assert.match(app, /class="timer-progress"[^>]*pathLength="100"/);
  assert.match(app, /class="timer-dot"/);
  assert.match(app, /id="timerProgressGradient" x1="78" y1="17" x2="78" y2="139"/);
  assert.doesNotMatch(app, /<span>静心练习<\/span>/);
  assert.match(app, /<time[^>]*>\$\{formatTime\(state\.secondsRemaining\)\}<\/time>[\s\S]*<small>剩余时间<\/small>/);
  assert.match(css, /\.timer-ring\s*{[^}]*width:\s*156px/s);
  assert.match(css, /\.timer-progress\s*{[^}]*stroke-width:\s*14[^}]*stroke-linecap:\s*round/s);
  assert.match(css, /\.timer-dot\s*{[^}]*width:\s*20px[^}]*border:\s*4px solid #fff[^}]*background:\s*transparent/s);
  assert.match(css, /\.timer-progress\s*{[^}]*animation:\s*timer-progress 20s linear forwards/s);
  assert.match(css, /\.timer-dot-orbit\s*{[^}]*animation:\s*timer-dot-orbit 20s linear forwards/s);
  assert.match(css, /\.is-timer-running \.timer-progress,[\s\S]*animation-play-state:\s*running/s);
  assert.match(css, /\.timer-copy\s*{[^}]*position:\s*absolute[^}]*inset:\s*0/s);
  assert.match(css, /\.timer-copy time\s*{[^}]*top:\s*50%[^}]*left:\s*50%[^}]*transform:\s*translate\(-50%,\s*-50%\)/s);
  assert.match(css, /\.timer-copy small\s*{[^}]*top:\s*104px[^}]*left:\s*50%[^}]*font-size:\s*11px[^}]*transform:\s*translateX\(-50%\)/s);
  assert.match(css, /\.timer-panel > p\s*{[^}]*font-weight:\s*400/s);
  assert.doesNotMatch(css, /\.timer-ring::after/);
});

test("applies media mute policy and segment replay", () => {
  assert.match(app, /sceneVideo\.muted\s*=\s*scene\.muted/);
  assert.match(app, /fromScreen === "recommendation"[\s\S]*sceneVideo\.currentTime\s*=\s*0/);
  assert.match(app, /shouldReplaySegment\(state\.screen, sceneVideo\.currentTime\)/);
});

test("runs the approved five-second settled reward timeline", () => {
  assert.match(app, /state\.screen === "reward-settled"/);
  assert.match(app, /1500/);
  assert.match(app, /5000/);
  assert.match(app, /REWARD_SETTLE_COMPLETE/);
  assert.match(app, /is-settled-components-visible/);
  assert.match(app, /is-tent-dropping/);
});

test("removes meditation feedback UI and handlers", () => {
  assert.doesNotMatch(app, /这次感觉如何|轻松一些|没进入状态|反馈已记录/);
  assert.doesNotMatch(app, /SELECT_MOOD|SKIP_FEEDBACK|FEEDBACK_COMPLETE/);
});

test("uses full-screen media and a warm transition veil", () => {
  assert.match(css, /\.scene-video\s*{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.media-transition\s*{/);
  assert.match(css, /\.is-media-veiled \.media-transition\s*{[^}]*opacity:\s*1/s);
});

test("uses independent icon controls on a navigation-style meditation dock", () => {
  assert.match(
    css,
    /\.primary-action\s*{[^}]*border:\s*1px solid rgba\(255, 245, 181, 0\.88\)[^}]*background:\s*linear-gradient\(135deg, #f8d553, #e8ff66\)/s,
  );
  assert.match(app, /aria-label="\$\{state\.isPaused \? "继续冥想" : "暂停冥想"\}"/);
  assert.match(app, /src="\.\/assets\/\$\{state\.isPaused \? "play" : "pause"\}\.svg"/);
  assert.match(app, /data-action="end" aria-label="结束冥想"/);
  assert.match(app, /src="\.\/assets\/stop\.svg"/);
  assert.match(css, /\.session-controls\s*{[^}]*width:\s*100%[^}]*height:\s*110px[^}]*gap:\s*12px/s);
  assert.match(css, /\.session-controls\s*{[^}]*border-top:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)[^}]*border-radius:\s*32px 32px 0 0/s);
  assert.match(css, /\.session-controls\s*{[^}]*background:\s*rgba\(20,\s*13,\s*9,\s*0\.72\)[^}]*backdrop-filter:\s*blur\(18px\) saturate\(1\.2\)/s);
  assert.match(css, /\.session-control\s*{[^}]*width:\s*64px[^}]*height:\s*64px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.session-control img\s*{[^}]*width:\s*24px[^}]*height:\s*24px/s);
});

test("places the claim label inside a face-safe reward bubble", () => {
  assert.match(css, /\.claim-reward\s*{[^}]*left:\s*74%[^}]*top:\s*51%/s);
  assert.match(css, /\.claim-label\s*{[^}]*background:\s*transparent[^}]*font-weight:\s*400/s);
});

test("spreads one-shot reward confetti across the full viewport", () => {
  const particles = html.match(/<i style="--left:/g) ?? [];
  assert.ok(particles.length >= 24);
  assert.match(
    css,
    /\.reward-particles\s*{[^}]*inset:\s*0[^}]*overflow:\s*hidden[^}]*pointer-events:\s*none/s,
  );
  assert.match(css, /\.is-reward-entered \.reward-particles i\s*{[^}]*1800ms/s);
  assert.match(css, /calc\(1800ms - var\(--d\)\)/);
  assert.match(html, /--d: 420ms/);
  assert.match(css, /translate3d\(var\(--drift\),\s*var\(--fall\),\s*0\)/);
});

test("uses regular weight across the interface", () => {
  assert.match(css, /\.app-shell,\s*\.app-shell \*\s*{[^}]*font-weight:\s*400/s);
  assert.match(css, /\.task-details strong,[\s\S]*\.task-card \.check\s*{[^}]*font-weight:\s*400/s);
});

test("shows a compact single-line growth base identity on subtle glass", () => {
  assert.match(
    html,
    /class="streak-primary">连续18天<[\s\S]*class="streak-divider">·<[\s\S]*class="base-level">成长基地\s*<strong>Lv\.2<\/strong>/,
  );
  assert.match(css, /\.streak\s*{[^}]*display:\s*flex[^}]*min-height:\s*32px[^}]*padding:\s*0 10px 0 8px/s);
  assert.match(css, /\.streak\s*{[^}]*border-radius:\s*12px[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)[^}]*backdrop-filter:\s*blur\(10px\)/s);
  assert.match(css, /\.streak-primary\s*{[^}]*font-size:\s*12px[^}]*line-height:\s*16px/s);
  assert.match(css, /\.base-level\s*{[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.74\)[^}]*font-size:\s*11px[^}]*line-height:\s*16px/s);
  assert.match(css, /\.base-level strong\s*{[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.92\)[^}]*font-weight:\s*400/s);
  assert.doesNotMatch(css, /\.streak\s*{[^}]*border:/s);
});

test("uses regular Chill Round for display and task copy only", () => {
  assert.match(
    css,
    /@font-face\s*{[^}]*font-family:\s*"Chill Round Subset"[^}]*rounded-display\.woff2[^}]*font-weight:\s*400/s,
  );
  assert.match(css, /:root\s*{[^}]*font-family:\s*"PingFang SC"[^}]*--display:\s*"Chill Round Subset"/s);
  assert.match(css, /\.welcome-greeting\s*{[^}]*font-family:\s*var\(--display\)/s);
  assert.match(css, /\.message h1\s*{[^}]*font-family:\s*var\(--display\)[^}]*font-weight:\s*400/s);
  assert.match(css, /\.task-card\s*{[^}]*font-family:\s*var\(--display\)/s);
});

test("uses the six-tab dark dock and compact task hierarchy", () => {
  const tabs = html.match(/class="nav-item/g) ?? [];
  assert.equal(tabs.length, 6);
  for (const label of ["AI教练", "预约私教", "Skill", "训练计划", "积分", "我的"]) {
    assert.match(html, new RegExp(`class="nav-label">${label}<`));
  }
  assert.match(html, /data-nav="coach"[^>]*aria-current="page"/);
  assert.match(app, /nav === "trainer"[\s\S]*trainerBooking\.show\(\)/);
  assert.match(app, /nav === "coach"[\s\S]*trainerBooking\.hide\(\)/);
  assert.match(app, /else \{\s*showToast\("敬请期待"\)/);
  assert.match(css, /\.bottom-nav\s*{[^}]*right:\s*0[^}]*bottom:\s*0[^}]*left:\s*0[^}]*height:\s*70px/s);
  assert.doesNotMatch(
    css,
    /@media \(max-width:\s*374px\)[\s\S]*?\.bottom-nav\s*{[^}]*right:\s*16px[^}]*left:\s*16px/s,
  );
  assert.match(css, /\.bottom-nav\s*{[^}]*background:\s*rgba\(20,\s*13,\s*9,\s*0\.72\)/s);
  assert.match(css, /\.bottom-nav\s*{[^}]*padding:\s*8px/s);
  assert.match(css, /\.bottom-nav\s*{[^}]*border-radius:\s*32px 32px 0 0/s);
  assert.match(css, /\.bottom-nav\s*{[^}]*--nav-indicator-x:\s*0%[^}]*isolation:\s*isolate/s);
  assert.match(css, /\.bottom-nav::before\s*{[^}]*top:\s*8px[^}]*bottom:\s*8px[^}]*left:\s*8px[^}]*width:\s*calc\(\(100% - 16px\) \/ 6\)[^}]*border-radius:\s*999px[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)[^}]*transform:\s*translateX\(var\(--nav-indicator-x\)\)[^}]*transition:\s*transform 300ms cubic-bezier\(0\.22, 1\.18, 0\.36, 1\)/s);
  assert.match(css, /\.nav-item\s*{[^}]*position:\s*relative[^}]*z-index:\s*1/s);
  assert.match(css, /\.nav-item\.is-active\s*{[^}]*border-radius:\s*999px[^}]*background:\s*transparent/s);
  assert.match(css, /\.nav-item\.is-active \.nav-icon\s*{[^}]*color:\s*#fff[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(css, /\.nav-item\.is-active \.nav-label\s*{[^}]*color:\s*#fff/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.bottom-nav::before\s*{[^}]*transition:\s*none !important/s);
  assert.match(app, /function setActiveNavigation\(nav\)[\s\S]*activeIndex[\s\S]*--nav-indicator-x[\s\S]*`\$\{activeIndex \* 100\}%`/s);
  assert.match(css, /\.task-rail\s*{[^}]*bottom:\s*76px[^}]*height:\s*98px[^}]*gap:\s*4px/s);
});

test("uses compact content-sized primary controls", () => {
  assert.match(
    css,
    /\.primary-action\s*{[^}]*width:\s*auto[^}]*min-width:\s*150px[^}]*min-height:\s*46px[^}]*padding:\s*0 24px/s,
  );
  assert.match(
    css,
    /\.glass-action\s*{[^}]*min-width:\s*150px[^}]*min-height:\s*46px[^}]*padding:\s*0 24px/s,
  );
});

test("keeps the current meal icon inside the shared current-card frame", () => {
  assert.doesNotMatch(css, /\.is-current\[data-task-icon="meal"\] \.task-visual\s*{/);
});

test("keeps motion fallbacks and a visible focus state for the claim bubble", () => {
  assert.match(css, /\.claim-reward:focus-visible\s*{/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.claim-reward/s);
  assert.match(css, /\.is-time-shifting \.demo-clock-track\s*{/);
});

test("task cards share the approved left-image right-copy structure", () => {
  assert.match(app, /class="task-visual"[\s\S]*class="task-copy"/);
  assert.match(app, /class="task-details"[\s\S]*<strong>\$\{label\}<\/strong>[\s\S]*class="task-reward/);
  assert.match(css, /\.task-card\s*{[^}]*grid-template-columns:\s*40px minmax\(0,\s*1fr\)[^}]*column-gap:\s*7px/s);
  assert.match(css, /\.task-card\.is-current\s*{[^}]*grid-template-columns:\s*56px minmax\(0,\s*1fr\)[^}]*column-gap:\s*10px/s);
});

test("completed task cards use the Remix checkbox-circle SVG", () => {
  assert.doesNotMatch(app, />✓</);
  assert.match(app, /<svg class="check"[^>]*viewBox="0 0 24 24"[^>]*aria-hidden="true"/);
  assert.match(app, /M12 22C6\.47715 22 2 17\.5228 2 12/);
  assert.match(css, /\.task-card \.check\s*{[^}]*position:\s*absolute[^}]*top:\s*6px[^}]*right:\s*6px[^}]*width:\s*18px[^}]*fill:\s*currentColor/s);
});

test("current card uses the approved diagonal glass gradient without an outline", () => {
  assert.match(css, /linear-gradient\(\s*135deg,\s*rgba\(255,\s*241,\s*138/);
  assert.match(css, /rgba\(212,\s*243,\s*255/);
  assert.doesNotMatch(css, /\.task-card\.is-current[^}]*inset 0 0 0 2px/s);
});

test("supporting recommendation copy uses regular weight", () => {
  assert.match(css, /\.supporting\s*{[^}]*font-weight:\s*400/s);
});

test("adds breathing room below direct message titles", () => {
  const supportingAfterTitle = getCssRule(css, ".message h1 + .supporting");

  assert.match(supportingAfterTitle?.block ?? "", /margin-top:\s*8px/);
});

test("renders the approved greeting and lightweight daily goal copy", () => {
  assert.match(app, /\$\{getGreeting\(new Date\(\)\.getHours\(\)\)\}，Maggie/);
  assert.match(app, /今日任务 \$\{progress\}\/4，\$\{status\}/);
  assert.match(app, /progress === 4 \? "帐篷营地已获得" : "完成可获得帐篷营地"/);
  assert.doesNotMatch(app, /growth-dots/);
  assert.match(css, /\.growth-cue\s*{[^}]*font-size:\s*12px[^}]*font-weight:\s*400/s);
  assert.doesNotMatch(css, /\.growth-cue\s*{[^}]*background:/s);
});

test("keeps rewards in every card and places status at top-left", () => {
  assert.match(app, /class="task-reward reward-\$\{reward\.attribute\}"/);
  assert.match(app, /<small>\$\{reward\.label\}<\/small>[\s\S]*<b>\+\$\{reward\.value\}<\/b>/);
  assert.doesNotMatch(app, /\$\{!done \? `<span class="task-reward/);
  assert.match(css, /\.current-label\s*{[^}]*top:\s*7px[^}]*left:\s*7px/s);
});

test("uses the approved copy spacing and right padding", () => {
  assert.match(css, /\.task-card\s*{[^}]*padding:\s*8px 10px 8px 8px/s);
  assert.match(css, /\.task-details\s*{[^}]*gap:\s*3px/s);
  assert.match(css, /\.is-current \.task-details\s*{[^}]*gap:\s*4px/s);
  assert.match(css, /\.task-reward\s*{[^}]*font-size:\s*10px[^}]*white-space:\s*nowrap/s);
});

test("provides a persistent collectible growth bubble layer", () => {
  assert.match(html, /id="growthBubbleLayer"[^>]*aria-label="待领取成长奖励"/);
  assert.match(app, /getVisibleBubbles\(growthState\)/);
  assert.match(app, /data-action="collect-growth"/);
  assert.match(app, /data-reward-ids="\$\{bubble\.rewardIds\.join\(","\)\}"/);
  assert.match(
    app,
    /class="growth-bubble-label"[^>]*>\s*<img(?=[^>]*src="\$\{getGrowthStatItem\(bubble\.attribute\)\.icon\}")[^>]*>\s*<small>\$\{ATTRIBUTE_LABELS\[bubble\.attribute\]\}<\/small>/s,
  );

  const bubbleLabel = getCssRule(css, ".growth-bubble-label");
  const bubbleLabelIcon = getCssRule(css, ".growth-bubble-label img");
  assert.match(bubbleLabel?.block ?? "", /display:\s*inline-flex/);
  assert.match(bubbleLabel?.block ?? "", /gap:\s*3px/);
  assert.match(bubbleLabelIcon?.block ?? "", /width:\s*12px/);
  assert.match(bubbleLabelIcon?.block ?? "", /height:\s*12px/);
});

test("renders three non-interactive growth stats in the Figma order", () => {
  assert.match(html, /id="growthStats"[^>]*aria-label="成长数值"/);
  assert.match(app, /getGrowthStatItems\(growthState\.totals\)/);
  assert.match(app, /data-growth-stat="\$\{attribute\}"/);
  assert.match(growthStatsModel, /growth-vitality\.png/);
  assert.match(growthStatsModel, /growth-focus\.png/);
  assert.match(growthStatsModel, /growth-stamina\.png/);
  assert.doesNotMatch(app, /<button[^>]*data-growth-stat/);
});

test("uses fixed Figma-sized glass stat entries and hides them on the trainer page", () => {
  assert.match(css, /\.growth-stat-main\s*{[^}]*width:\s*40px[^}]*height:\s*40px[^}]*border-radius:\s*14px/s);
  assert.match(css, /\.growth-stats\s*{[^}]*right:\s*20px[^}]*display:\s*grid/s);
  assert.match(css, /\.is-trainer-view \.growth-stats\s*{[^}]*display:\s*none/s);

  const activeGrowthStats = getCssRule(css, '.app-shell[data-screen="active"] .growth-stats');
  assert.match(activeGrowthStats?.block ?? "", /opacity:\s*0/);
  assert.match(activeGrowthStats?.block ?? "", /visibility:\s*hidden/);
  assert.match(
    app,
    /growthStats\.setAttribute\(\s*"aria-hidden"\s*,\s*String\(state\.screen\s*===\s*"active"\)\s*\)/,
  );
});

test("persists one growth envelope and adds the meditation reward once", () => {
  assert.match(app, /const GROWTH_KEY = "growth-base\.growth-state"/);
  assert.match(app, /window\.localStorage\.setItem\(GROWTH_KEY, JSON\.stringify\(nextState\)\)/);
  assert.match(app, /addTaskReward\(growthState,[\s\S]*id: `\$\{dateKey\}:meditation`/);
  assert.match(app, /collectBubble\(growthState, rewardIds\)/);
});

test("uses the approved attached gradient bubble rim and palette", () => {
  assert.match(css, /\.growth-bubble\s*{[^}]*width:\s*62px[^}]*84%/s);
  assert.match(css, /\.growth-bubble::before\s*{[^}]*inset:\s*-2px[^}]*padding:\s*2px[^}]*conic-gradient/s);
  assert.match(css, /\.bubble-focus\s*{[^}]*#c5cec8/i);
  assert.match(css, /\.bubble-vitality\s*{[^}]*#e58a63/i);
  assert.match(css, /\.bubble-stamina\s*{[^}]*#ddb64c/i);
});

test("floats growth bubbles visibly with staggered vertical motion", () => {
  assert.match(css, /\.growth-bubble\.anchor-1\s*{[^}]*--float-y:\s*-6px[^}]*--float-duration:\s*4\.8s/s);
  assert.match(css, /\.growth-bubble\.anchor-2\s*{[^}]*--float-y:\s*-8px[^}]*--float-duration:\s*6\.1s/s);
  assert.match(css, /\.growth-bubble\.anchor-3\s*{[^}]*--float-y:\s*-7px[^}]*--float-duration:\s*5\.4s/s);
  assert.match(css, /\.growth-bubble\.anchor-4\s*{[^}]*--float-y:\s*-6px[^}]*--float-duration:\s*5s/s);
  assert.match(css, /@keyframes growth-bubble-float[\s\S]*translate3d\(0,\s*var\(--float-y\),\s*0\)/);
  assert.doesNotMatch(css, /@keyframes growth-bubble-float\s*{[^@]*scale\(/s);
  assert.match(css, /@keyframes collect-growth-bubble[\s\S]*left:\s*var\(--collect-end-x\)[\s\S]*top:\s*var\(--collect-end-y\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.growth-bubble[\s\S]*animation:\s*none !important/s);
});

test("flies bubbles to their live stat target before committing", () => {
  assert.match(app, /previewBubbleCollection\(growthState, rewardIds\)/);
  assert.match(app, /getBoundingClientRect\(\)/);
  assert.match(app, /growthBubbleLayer\.getBoundingClientRect\(\)/);
  assert.match(app, /--collect-start-x/);
  assert.match(app, /--collect-start-y/);
  assert.match(app, /--collect-end-x/);
  assert.match(app, /--collect-end-y/);
  assert.match(app, /queueGrowthStatRoll\(preview\)/);
});

test("rolls old value through icon plus increment to the new total", () => {
  assert.match(app, /growth-stat-roll-track/);
  assert.match(app, /growth-stat-roll-increment[^>]*>[\s\S]*\+\$\{increment\}/);
  assert.match(css, /\.growth-stat-roll-track\s*{[^}]*height:\s*120px/s);
  assert.match(css, /@keyframes growth-stat-roll[\s\S]*translateY\(-80px\)/);
  assert.match(css, /\.growth-stat-main\.is-rolling \.growth-stat-roll-track/);
});

test("keeps collection flight and increment feedback visible long enough to follow", () => {
  assert.match(css, /\.growth-bubble-layer\s*{[^}]*z-index:\s*15/s);
  assert.match(css, /\.growth-bubble\.is-collecting\s*{[^}]*1080ms cubic-bezier\(0\.4, 0, 0\.2, 1\)/s);
  assert.match(css, /@keyframes collect-growth-bubble[\s\S]*82%\s*{[^}]*left:\s*var\(--collect-end-x\)[^}]*top:\s*var\(--collect-end-y\)[^}]*opacity:\s*1[^}]*scale\(0\.32\)/s);
  assert.match(css, /\.growth-stat-main\.is-rolling \.growth-stat-roll-track\s*{[^}]*1200ms/s);
  assert.match(css, /@keyframes growth-stat-roll[\s\S]*36%,\s*72%\s*{[^}]*translateY\(-40px\)/s);
  assert.match(app, /window\.setTimeout\(finish, 1200\)/);
  assert.match(app, /window\.setTimeout\(finish, 1380\)/);
});

test("reduces collection motion without waiting for animationend", () => {
  assert.match(app, /reducedMotion\.matches[\s\S]*commitGrowthCollection/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.growth-stat-main/s);
});

test("uses a true regular title face and leaves room above the task rail", () => {
  assert.match(css, /\.message h1\s*{[^}]*font-family:\s*var\(--display\)/s);
  assert.match(css, /\.message\s*{[^}]*top:\s*80px/s);
  assert.match(css, /@media \(max-width:\s*899px\) and \(max-height:\s*790px\)[\s\S]*\.message\s*{[^}]*top:\s*72px/s);
  assert.match(css, /\.action-zone\s*{[^}]*bottom:\s*202px/s);
  assert.match(css, /@media \(max-width:\s*899px\) and \(max-height:\s*790px\)[\s\S]*\.action-zone\s*{[^}]*bottom:\s*202px/s);
});

test("current and small cards preserve the same horizontal information order", () => {
  assert.match(css, /\.task-visual\s*{[^}]*width:\s*40px[^}]*height:\s*40px/s);
  assert.match(css, /\.is-current \.task-visual\s*{[^}]*width:\s*56px[^}]*height:\s*56px/s);
  assert.doesNotMatch(css, /\.is-current \.task-visual\s*{[^}]*transform:/s);
});

test("task icon variants stay inside the shared horizontal frame", () => {
  assert.match(app, /data-task-icon="\$\{icon\}"/);
  assert.doesNotMatch(css, /\n\[data-task-icon="fitness"\] \.task-visual\s*{/);
  assert.doesNotMatch(css, /\.is-current\[data-task-icon="fitness"\] \.task-visual\s*{/);
  assert.doesNotMatch(css, /\.is-current\[data-task-icon="meal"\] \.task-visual\s*{/);
});

test("uses the approved C2 schedule dimensions", () => {
  assert.match(css, /\.task-rail\s*{[^}]*height:\s*98px[^}]*padding:\s*5px calc\(50% - 75px\) 5px/s);
  assert.match(css, /\.task-card\s*{[^}]*flex:\s*0 0 118px[^}]*width:\s*118px[^}]*height:\s*72px[^}]*border-radius:\s*14px/s);
  assert.match(css, /\.task-card\.is-current\s*{[^}]*flex-basis:\s*150px[^}]*width:\s*150px[^}]*height:\s*88px/s);
});

test("styles reward settling without standalone character CSS", () => {
  assert.doesNotMatch(css, /\.character(?:-stage)?\b/);
  assert.match(css, /\.reward-layer\s*{/);
  assert.match(css, /\.is-tent-dropping \.reward-object\s*{/);
  assert.match(css, /\.is-settled-components-visible\[data-screen="reward-settled"\] \.message/);
  assert.match(css, /\.reward-object\s*{[^}]*bottom:\s*188px/s);
});

test("provides one direct interactive app without the desktop portfolio showcase", () => {
  const allTags = getOpeningTags(html);
  const apps = allTags.filter((tag) => getAttribute(tag, "id") === "app");

  assert.equal(apps.length, 1);
  assert.match(apps[0], /^<main\b/i);
  assert.equal(hasClass(apps[0], "app-shell"), true);
  assert.doesNotMatch(html, /portfolio-(?:page|hero|video)/);
  assert.doesNotMatch(html, /portfolio-showcase\.js/);
  assert.doesNotMatch(css, /\.portfolio-(?:page|hero|video)/);
});

test("softly blurs both watermark corners on the app video", () => {
  const sharedMask = getCssRule(css, ".has-media.app-shell::before");
  const root = getCssRule(css, ":root");

  assert.equal(
    [".has-media.app-shell::before", ".has-media.app-shell::after"].every((selector) =>
      sharedMask?.selectors.includes(selector),
    ),
    true,
  );
  assert.match(sharedMask?.block ?? "", /position:\s*absolute/);
  assert.match(sharedMask?.block ?? "", /content:\s*""/);
  assert.match(sharedMask?.block ?? "", /width:\s*var\(--watermark-mask-width\)/);
  assert.match(sharedMask?.block ?? "", /height:\s*var\(--watermark-mask-height\)/);
  assert.match(sharedMask?.block ?? "", /background:\s*var\(--watermark-mask-tint\)/);
  assert.match(sharedMask?.block ?? "", /backdrop-filter:\s*blur\(var\(--watermark-mask-blur\)\)/);
  assert.match(sharedMask?.block ?? "", /-webkit-backdrop-filter:\s*blur\(var\(--watermark-mask-blur\)\)/);
  assert.match(sharedMask?.block ?? "", /pointer-events:\s*none/);

  assert.match(root?.block ?? "", /--watermark-mask-blur:\s*8px/);
  assert.match(root?.block ?? "", /--watermark-mask-width:\s*17%/);
  assert.match(root?.block ?? "", /--watermark-mask-height:\s*5\.5%/);
  assert.match(root?.block ?? "", /--watermark-mask-inset:\s*1\.2%/);
  assert.match(root?.block ?? "", /--watermark-mask-tint:\s*rgba\(20,\s*16,\s*13,\s*0\.08\)/);

  assert.match(css, /\.has-media\.app-shell::before,\s*\.has-media\.app-shell::after\s*{[^}]*z-index:\s*3/s);
  assert.match(
    css,
    /\.has-media\.app-shell::before\s*{[^}]*top:\s*var\(--watermark-mask-inset\)[^}]*left:\s*0(?:px)?\s*;[^}]*mask-image:\s*radial-gradient\(ellipse at top left,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)[^}]*-webkit-mask-image:\s*radial-gradient\(ellipse at top left,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)/s,
  );
  assert.match(
    css,
    /\.has-media\.app-shell::after\s*{[^}]*right:\s*0(?:px)?\s*;[^}]*bottom:\s*var\(--watermark-mask-inset\)[^}]*mask-image:\s*radial-gradient\(ellipse at bottom right,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)[^}]*-webkit-mask-image:\s*radial-gradient\(ellipse at bottom right,\s*#000\s*0\s*24%,\s*rgba\(0,\s*0,\s*0,\s*0\.72\)\s*48%,\s*transparent\s*88%\)/s,
  );
});

test("keeps compact mobile layout adjustments out of desktop samples", () => {
  assert.match(css, /@media\s*\(max-width:\s*899px\)\s*and\s*\(max-height:\s*790px\)/);
});
