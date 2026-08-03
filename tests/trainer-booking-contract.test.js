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
    /\.trainer-credentials\s*{[^}]*position:\s*absolute[^}]*left:\s*22px[^}]*bottom:\s*28px[^}]*width:\s*184px[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[^}]*list-style:\s*none/s,
  );
  assert.match(css, /\.trainer-credential \+ \.trainer-credential::before\s*{[^}]*height:\s*28px/s);
  assert.match(css, /\.trainer-credential strong,[\s\S]*white-space:\s*nowrap/s);
});

test("adds restrained depth and breathing room to the trainer Hero", () => {
  assert.match(
    css,
    /\.trainer-credential-icon\s*{[^}]*border:\s*1px solid rgba\(255, 236, 200, 0\.14\)[^}]*color:\s*rgba\(248, 213, 83, 0\.78\)[^}]*background:\s*rgba\(255, 248, 230, 0\.075\)/s,
  );
  assert.doesNotMatch(css, /\.trainer-credential-icon::before\s*{/);
  assert.doesNotMatch(css, /\.trainer-credential-icon[\s\S]*?conic-gradient\(/);
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
  assert.match(css, /\.trainer-store\s*{[^}]*text-decoration:\s*none/s);
  assert.match(css, /\.trainer-store:focus-visible\s*{[^}]*outline:/s);
  assert.match(css, /\.trainer-store:active\s*{[^}]*transform:\s*translateY\(1px\)/s);
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
  assert.match(css, /\.store-row > span\s*{[^}]*color:\s*var\(--trainer-text-muted\)[^}]*font-size:\s*32px/s);
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
