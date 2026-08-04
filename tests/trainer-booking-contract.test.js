import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/trainer-booking.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/trainer-booking-view.js", import.meta.url), "utf8");
const mapPin = readFileSync(new URL("../assets/trainer-map-pin.svg", import.meta.url), "utf8");

test("provides the complete trainer booking surface", () => {
  for (const id of ["trainerPage", "bookingDates", "bookingTimes", "bookingActionBar", "bookingDialog"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("keeps the map and all three nearby stores", () => {
  assert.match(html, /assets\/trainer-map\.png/);
  assert.match(
    html,
    /<span class="nearby-summary">附近有3家 ｜ 深圳市有128家 <i aria-hidden="true">›<\/i><\/span>/,
  );
  for (const store of ["南浦大桥店", "前海湾旗舰店", "海上世界店"]) {
    assert.match(html, new RegExp(store));
  }
});

test("defers large trainer images until the trainer page opens", () => {
  const deferred = html.match(/data-deferred-src="\.\/assets\/trainer-(?:hero|map)\.png"/g) ?? [];
  assert.equal(deferred.length, 2);
  assert.doesNotMatch(
    html,
    /<img(?=[^>]*trainer-(?:hero|map)\.png)[^>]*\ssrc="\.\/assets\/trainer-(?:hero|map)\.png"/,
  );
  assert.match(
    view,
    /const deferredTrainerImages = \[\.\.\.trainerPage\.querySelectorAll\("img\[data-deferred-src\]"\)\]/,
  );
  assert.match(
    view,
    /function show\(\)[\s\S]*loadDeferredTrainerImages\(deferredTrainerImages\)[\s\S]*trainerPage\.hidden = false/,
  );
});

test("places persistent status before the date cards", () => {
  assert.match(html, /id="bookingStatus"[\s\S]*id="bookingDates"/);
});

test("uses cancel then confirm and omits payment copy", () => {
  assert.match(
    html,
    /data-action="cancel-booking-selection"[\s\S]*data-action="open-booking-dialog"/,
  );
  assert.doesNotMatch(html, /扣除 1 课时|剩余\s*\d+\s*节/);
  assert.doesNotMatch(html, /费用|价格|实付/);
});

test("keeps the fixed coach identity concise", () => {
  assert.match(html, /中田健身 · 南山旗舰店/);
  assert.match(html, /id="bookingDialog" aria-labelledby="bookingDialogTitle"/);
  assert.doesNotMatch(html, /评分|好评率|完课数|认证教练/);
});

test("places three coach credentials in the lower-left Hero gap", () => {
  assert.match(
    html,
    /<ul class="trainer-credentials" aria-label="教练资质">[\s\S]*专业认证[\s\S]*NASM-CPT[\s\S]*减脂塑形[\s\S]*专项训练[\s\S]*科学指导[\s\S]*定制计划[\s\S]*<\/ul>/,
  );
  assert.equal((html.match(/class="trainer-credential"/g) ?? []).length, 3);
  assert.match(html, /class="trainer-credential-icon" aria-hidden="true"/);
  assert.match(
    css,
    /\.trainer-credentials\s*{[^}]*position:\s*absolute[^}]*left:\s*22px[^}]*bottom:\s*28px[^}]*width:\s*204px[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[^}]*column-gap:\s*4px[^}]*list-style:\s*none/s,
  );
  assert.match(
    css,
    /\.trainer-credential \+ \.trainer-credential::before\s*{[^}]*top:\s*9px[^}]*left:\s*-2px[^}]*height:\s*34px[^}]*background:\s*linear-gradient\(\s*to bottom,\s*transparent 0%,\s*rgba\(255, 250, 243, 0\.16\) 28%,\s*rgba\(255, 250, 243, 0\.16\) 72%,\s*transparent 100%\s*\)/s,
  );
  assert.match(css, /\.trainer-credential strong,[\s\S]*white-space:\s*nowrap/s);
  assert.match(css, /\.trainer-credential small\s*{[^}]*margin-top:\s*5px/s);
});

test("adds restrained depth and breathing room to the trainer Hero", () => {
  assert.match(
    css,
    /\.trainer-credential-icon\s*{[^}]*border:\s*1px solid rgba\(255, 236, 200, 0\.14\)[^}]*color:\s*rgba\(248, 213, 83, 0\.78\)[^}]*background:\s*rgba\(255, 248, 230, 0\.075\)/s,
  );
  assert.doesNotMatch(css, /\.trainer-credential-icon::before\s*{/);
  assert.doesNotMatch(css, /\.trainer-credential-icon\s*{[^}]*conic-gradient\(/s);
  assert.match(css, /\.trainer-content\s*{[^}]*margin-top:\s*0/s);
  assert.match(
    css,
    /\.trainer-hero::before\s*{[^}]*right:\s*-54px[^}]*width:\s*270px[^}]*height:\s*390px[^}]*linear-gradient\(\s*112deg[^}]*rgba\(125, 173, 194, 0\.12\)[^}]*filter:\s*blur\(22px\)[^}]*pointer-events:\s*none/s,
  );
});

test("links the complete store row to map navigation", () => {
  assert.match(html, /<p>减脂塑形教练 · 8年经验<\/p>/);
  assert.match(
    html,
    /<a\s+class="trainer-store"[^>]*href="https:\/\/uri\.amap\.com\/search\?keyword=[^"]+"[^>]*target="_blank"[^>]*aria-label="在地图中导航到中田健身 · 南山旗舰店"/,
  );
  assert.match(html, /class="trainer-store-navigation"[^>]*aria-hidden="true"/);
  assert.match(
    html,
    /<a\s+class="trainer-store"[^>]*>[\s\S]*?<span>中田健身 · 南山旗舰店<\/span>\s*<span class="trainer-store-distance">1\.2km<\/span>\s*<span class="trainer-store-navigation" aria-hidden="true">\s*<svg[^>]*viewBox="0 0 24 24"[^>]*>[\s\S]*?<\/svg>\s*<\/span>\s*<\/a>/,
  );
  assert.doesNotMatch(html, /class="trainer-store-navigation"[^>]*>↗<\/span>/);
  assert.match(css, /\.trainer-store\s*{[^}]*text-decoration:\s*none[^}]*white-space:\s*nowrap/s);
  assert.match(
    css,
    /\.trainer-store-distance\s*{[^}]*color:\s*rgba\(255, 250, 243, 0\.5\)[^}]*font-size:\s*10px[^}]*font-variant-numeric:\s*tabular-nums/s,
  );
  assert.match(css, /\.trainer-store-navigation svg\s*{[^}]*width:\s*14px[^}]*height:\s*14px[^}]*stroke:\s*currentColor/s);
  assert.match(css, /\.trainer-store:focus-visible\s*{[^}]*outline:/s);
  assert.match(css, /\.trainer-store:active\s*{[^}]*transform:\s*translateY\(1px\)/s);
});

test("polishes store hierarchy and supporting trainer details", () => {
  for (const sequence of ["01", "02", "03"]) {
    assert.match(html, new RegExp(`<b aria-hidden="true">${sequence}<\\/b>`));
  }
  assert.equal((html.match(/class="store-nearest"/g) ?? []).length, 1);
  assert.match(html, /<span class="store-nearest">最近<\/span><span>南浦大桥店<\/span>/);
  for (const [name, status, address, hours, features, distance] of [
    ["南浦大桥店", "营业中", "南浦一路111号一层", "10:00–24:00", "私教体验 · 体态检测", "756m"],
    ["前海湾旗舰店", "营业中", "前海路99号B1层", "09:00–22:00", "私教体验 · 停车方便", "2.8km"],
    ["海上世界店", "已打烊", "望海路1187号商业中心", "10:00–21:30", "体态检测 · 停车方便", "4.1km"],
  ]) {
    assert.match(
      html,
      new RegExp(`<span>${name}<\\/span><em>${status}<\\/em><\\/h3>\\s*<p>${address}<\\/p>\\s*<small><span class="store-hours">${hours}<\\/span><span class="store-detail-separator" aria-hidden="true">·<\\/span><span class="store-features">${features}<\\/span><\\/small>[\\s\\S]*?class="store-distance"><span>${distance}<\\/span>`),
    );
  }
  for (const distance of ["756m", "2.8km", "4.1km"]) {
    assert.match(html, new RegExp(`class="store-distance"><span>${distance}<\\/span><i aria-hidden="true">›<\\/i><\\/span>`));
  }
  for (const oldAddress of ["756m · 南浦一路111号一层", "2.8km · 前海路99号B1层", "4.1km · 望海路1187号商业中心"]) {
    assert.doesNotMatch(html, new RegExp(oldAddress));
  }
  assert.match(css, /\.store-row\s*{[^}]*grid-template-columns:\s*20px minmax\(0, 1fr\) auto[^}]*min-height:\s*82px[^}]*border-top:\s*1px solid rgba\(255, 255, 255, 0\.06\)/s);
  const storeSequenceRule = css.match(/\.store-row > b\s*{[^}]*}/)?.[0] ?? "";
  assert.match(storeSequenceRule, /color:\s*rgba\(255, 250, 243, 0\.3\)[^}]*font-size:\s*10px[^}]*font-weight:\s*400[^}]*font-variant-numeric:\s*tabular-nums/s);
  assert.doesNotMatch(storeSequenceRule, /\b(?:border|border-radius|background)\s*:/);
  assert.match(css, /\.store-nearest\s*{[^}]*border:\s*1px solid rgba\(248, 213, 83, 0\.22\)[^}]*border-radius:\s*5px[^}]*color:\s*#f8d553[^}]*background:\s*rgba\(248, 213, 83, 0\.1\)[^}]*font-size:\s*8px/s);
  assert.match(css, /\.store-distance\s*{[^}]*display:\s*inline-flex[^}]*gap:\s*3px[^}]*align-items:\s*center[^}]*align-self:\s*center[^}]*font-size:\s*10px/s);
  assert.match(css, /\.store-distance i\s*{[^}]*font-size:\s*16px/s);
  assert.match(css, /\.store-hours\s*{[^}]*color:\s*rgba\(255, 250, 243, 0\.34\)[^}]*font-size:\s*9px[^}]*font-weight:\s*400/s);
  const storeFeaturesRule = css.match(/\.store-features\s*{[^}]*}/)?.[0] ?? "";
  assert.match(storeFeaturesRule, /overflow:\s*hidden[^}]*color:\s*rgba\(255, 250, 243, 0\.58\)[^}]*font-size:\s*9\.5px[^}]*font-weight:\s*500[^}]*text-overflow:\s*ellipsis/s);
  assert.doesNotMatch(storeFeaturesRule, /\b(?:border|background)\s*:/);
  assert.match(css, /\.store-row\.is-closed\s*{[^}]*opacity:\s*0\.56/s);
  assert.match(css, /\.booking-heading span\s*{[^}]*color:\s*var\(--trainer-text-muted\)/s);
  assert.match(css, /\.trainer-credential-icon\s*{[^}]*margin:\s*0 auto 7px/s);
});

test("omits redundant schedule labels", () => {
  assert.doesNotMatch(html, />可约时间</);
  assert.doesNotMatch(html, />已选择/);
});

test("preserves the dark Hero and glass panel framework", () => {
  assert.match(css, /\.trainer-page\s*{[^}]*background:\s*linear-gradient\(\s*135deg,\s*var\(--trainer-bg-from\) 0%,\s*var\(--trainer-bg-mid\) 46%,\s*var\(--trainer-bg-to\) 100%\s*\)/s);
  assert.match(css, /\.trainer-hero\s*{[^}]*height:\s*320px/s);
  assert.match(css, /\.booking-panel[\s\S]*backdrop-filter:\s*blur\(24px\)/s);
});

test("uses one full-width 70px bottom context and approved button size", () => {
  assert.match(css, /\.booking-action-bar\s*{[^}]*right:\s*0[^}]*bottom:\s*0[^}]*left:\s*0[^}]*height:\s*70px/s);
  assert.match(css, /\.booking-cancel-action,\s*\.booking-confirm-action\s*{[^}]*height:\s*46px/s);
  assert.match(css, /\.booking-confirm-action\s*{[^}]*padding:\s*0 24px/s);
});

test("keeps success status in normal layout flow", () => {
  assert.match(css, /\.booking-status\s*{[^}]*position:\s*relative/s);
  assert.doesNotMatch(css, /\.booking-status\s*{[^}]*position:\s*absolute/s);
});

test("renders accessible copy-free unavailable slots", () => {
  assert.match(view, /BOOKING_TIMES\.map/);
  assert.match(view, /button\.disabled = unavailable/);
  assert.match(view, /button\.textContent = time/);
  assert.match(view, /aria-pressed/);
  assert.doesNotMatch(view, /textContent\s*=\s*["'`]已约/);
});

test("restores tabs and persists the success row", () => {
  assert.match(view, /bookingStatus\.hidden = !confirmed/);
  assert.match(view, /app\.classList\.toggle\("is-booking-action"/);
  assert.match(view, /setTimeout[\s\S]*1200/s);
  assert.match(view, /bookingDialog\.close\(\)/);
  assert.match(view, /bottomNav\.inert = selected/);
  assert.match(view, /actionBar\.inert = !selected/);
  assert.match(view, /bookingStatus\.focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /if \(submitting\) event\.preventDefault\(\)/);
});

test("routes the trainer tab without changing stores", () => {
  assert.match(app, /mountTrainerBooking/);
  assert.match(app, /nav === "trainer"/);
  assert.match(app, /onShow: pauseHomeExperience/);
  assert.match(app, /onHide: resumeHomeExperience/);
  assert.match(app, /if \(trainerBooking\.isVisible\(\)\)[\s\S]*sceneVideo\.pause\(\)/);
  assert.doesNotMatch(view, /SELECT_STORE|selectedStore|store-detail/);
});

test("uses the supplied map pin without dimming the map", () => {
  assert.match(mapPin, /viewBox="0 0 200 200"/);
  assert.match(css, /\.map-pin::before\s*{[^}]*mask:\s*url\("\.\.\/assets\/trainer-map-pin\.svg"\)/s);
  assert.match(css, /\.map-pin\s*{[^}]*isolation:\s*isolate[^}]*color:\s*#745400[^}]*font-size:\s*9px[^}]*font-weight:\s*600/s);
  assert.match(css, /\.trainer-map > img\s*{[^}]*filter:\s*none[^}]*opacity:\s*1/s);
  assert.match(css, /\.map-pin\.is-closed\s*{[^}]*--pin-fill:\s*rgba\(205, 211, 219, 0\.72\)[^}]*color:\s*#3f4650/s);
  assert.match(css, /\.store-row\.is-closed > b\s*{[^}]*color:\s*rgba\(232, 224, 214, 0\.48\)/s);
});

test("uses the approved warm charcoal trainer foundation", () => {
  assert.match(
    css,
    /\.app-shell\.is-trainer-view\s*{[^}]*--trainer-bg-from:\s*#2a211a[^}]*--trainer-bg-mid:\s*#171411[^}]*--trainer-bg-to:\s*#090b0e[^}]*--trainer-text:\s*#fffaf3[^}]*--trainer-dock:\s*rgba\(22, 16, 13, 0\.96\)/s,
  );
  assert.match(
    css,
    /\.trainer-hero-shade\s*{[^}]*rgba\(23, 20, 17, 0\.94\)[^}]*rgba\(42, 33, 26, 0\.52\)/s,
  );
});

test("uses warm glass cards with a centered yellow booking edge", () => {
  assert.match(
    css,
    /\.booking-panel,\s*\.nearby-panel\s*{[^}]*border:\s*1px solid var\(--trainer-glass-border\)[^}]*background:\s*var\(--trainer-glass\)/s,
  );
  assert.match(
    css,
    /\.booking-panel::before\s*{[^}]*top:\s*0[^}]*left:\s*50%[^}]*width:\s*58%[^}]*height:\s*1px[^}]*background:\s*linear-gradient\(90deg, transparent 0%, rgba\(248, 213, 83, 0\.72\) 50%, transparent 100%\)[^}]*transform:\s*translateX\(-50%\)/s,
  );
});

test("warms booking controls and chrome while preserving map color", () => {
  assert.match(
    css,
    /\.booking-date,\s*\.booking-time\s*{[^}]*border:\s*1px solid var\(--trainer-slot-border\)[^}]*color:\s*var\(--trainer-text-muted\)[^}]*background:\s*var\(--trainer-slot\)/s,
  );
  assert.match(css, /\.booking-time:disabled\s*{[^}]*color:\s*rgba\(232, 224, 214, 0\.24\)[^}]*background:\s*rgba\(232, 224, 214, 0\.025\)/s);
  assert.match(css, /\.booking-dialog\s*{[^}]*color:\s*var\(--trainer-text\)[^}]*background:\s*linear-gradient\(170deg, #2a211a, #0d0e10\)/s);
  assert.match(css, /\.booking-action-bar\s*{[^}]*background:\s*var\(--trainer-dock\)/s);
  assert.match(css, /\.is-trainer-view \.bottom-nav\s*{[^}]*background:\s*var\(--trainer-dock\)/s);
  assert.match(css, /\.trainer-map > img\s*{[^}]*filter:\s*none[^}]*opacity:\s*1/s);
});

test("positions the trainer behind the booking card and strengthens store cues", () => {
  assert.match(css, /\.trainer-scroll\s*{[^}]*overflow-x:\s*hidden/s);
  assert.match(css, /\.trainer-hero\s*{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.trainer-hero > img\s*{[^}]*right:\s*-112px[^}]*top:\s*40px[^}]*bottom:\s*auto[^}]*height:\s*175%/s);
  assert.match(css, /\.trainer-hero-shade::after\s*{[^}]*top:\s*220px[^}]*height:\s*400px[^}]*rgba\(23, 20, 17, 0\.94\) 38%[^}]*rgba\(23, 20, 17, 0\.94\) 100%[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.trainer-hero-cut\s*{[^}]*display:\s*none/s);
  assert.match(css, /\.trainer-content\s*{[^}]*position:\s*relative[^}]*z-index:\s*2[^}]*margin-top:\s*0/s);
  assert.match(css, /\.trainer-identity\s*{[^}]*bottom:\s*110px/s);
  assert.match(css, /\.trainer-identity h1\s*{[^}]*margin:\s*12px 0 12px/s);
  assert.match(css, /\.nearby-heading \.nearby-summary\s*{[^}]*display:\s*inline-flex[^}]*gap:\s*4px[^}]*color:\s*var\(--trainer-text-muted\)/s);
  assert.match(css, /\.store-distance\s*{[^}]*color:\s*var\(--trainer-text-muted\)[^}]*font-size:\s*10px/s);
  assert.match(css, /\.store-list \.store-row:first-child\s*{[^}]*border-top:\s*0/s);
});

test("uses the approved full trainer and vertical date capsules", () => {
  assert.match(css, /\.trainer-hero > img\s*{[^}]*width:\s*auto[^}]*height:\s*175%[^}]*object-fit:\s*contain[^}]*object-position:\s*right top/s);
  assert.match(css, /\.booking-date\s*{[^}]*height:\s*68px[^}]*border-radius:\s*999px/s);
  assert.match(css, /\.booking-date strong\s*{[^}]*width:\s*28px[^}]*height:\s*28px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.booking-date\[aria-pressed="true"\]\s*{[^}]*color:\s*#16130b[^}]*background:\s*#f8d553/s);
});

test("extends the trainer background through the Dock and separates actions", () => {
  assert.match(css, /\.is-trainer-view \.bottom-nav\s*{[^}]*background:\s*var\(--trainer-dock\)/s);
  assert.match(css, /\.booking-action-bar > div\s*{[^}]*gap:\s*14px/s);
  assert.match(css, /\.booking-cancel-action\s*{[^}]*background:\s*transparent/s);
});

test("extends the trainer page behind the rounded Dock corners", () => {
  assert.match(css, /\.trainer-page\s*{[^}]*inset:\s*0;/s);
  assert.match(css, /\.trainer-content\s*{[^}]*padding:\s*0 14px 94px/s);
});
