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
  for (const store of ["南浦大桥店", "前海湾旗舰店", "海上世界店"]) {
    assert.match(html, new RegExp(store));
  }
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

test("omits redundant schedule labels", () => {
  assert.doesNotMatch(html, />可约时间</);
  assert.doesNotMatch(html, />已选择/);
});

test("preserves the dark Hero and glass panel framework", () => {
  assert.match(css, /\.trainer-page\s*{[^}]*background:\s*#0b0e14/s);
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
  assert.match(css, /\.store-row\.is-closed > b\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.52\)/s);
});

test("positions the trainer behind the booking card and strengthens store cues", () => {
  assert.match(css, /\.trainer-scroll\s*{[^}]*overflow-x:\s*hidden/s);
  assert.match(css, /\.trainer-hero\s*{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.trainer-hero > img\s*{[^}]*right:\s*-54px[^}]*top:\s*24px[^}]*bottom:\s*auto[^}]*height:\s*150%/s);
  assert.match(css, /\.trainer-hero-cut\s*{[^}]*display:\s*none/s);
  assert.match(css, /\.trainer-content\s*{[^}]*position:\s*relative[^}]*z-index:\s*2[^}]*margin-top:\s*-20px/s);
  assert.match(css, /\.trainer-identity\s*{[^}]*bottom:\s*110px/s);
  assert.match(css, /\.trainer-identity h1\s*{[^}]*margin:\s*12px 0 12px/s);
  assert.match(css, /\.nearby-heading span\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.62\)/s);
  assert.match(css, /\.store-row > span\s*{[^}]*color:\s*rgba\(255, 255, 255, 0\.62\)[^}]*font-size:\s*32px/s);
});

test("uses the approved full trainer and vertical date capsules", () => {
  assert.match(css, /\.trainer-hero > img\s*{[^}]*width:\s*auto[^}]*height:\s*100%[^}]*object-fit:\s*contain[^}]*object-position:\s*right bottom/s);
  assert.match(css, /\.booking-date\s*{[^}]*height:\s*68px[^}]*border-radius:\s*999px/s);
  assert.match(css, /\.booking-date strong\s*{[^}]*width:\s*28px[^}]*height:\s*28px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.booking-date\[aria-pressed="true"\]\s*{[^}]*color:\s*#16130b[^}]*background:\s*#f8d553/s);
});

test("extends the trainer background through the Dock and separates actions", () => {
  assert.match(css, /\.is-trainer-view \.bottom-nav\s*{[^}]*background:\s*rgba\(11, 14, 20, 0\.96\)/s);
  assert.match(css, /\.booking-action-bar > div\s*{[^}]*gap:\s*14px/s);
  assert.match(css, /\.booking-cancel-action\s*{[^}]*background:\s*transparent/s);
});

test("extends the trainer page behind the rounded Dock corners", () => {
  assert.match(css, /\.trainer-page\s*{[^}]*inset:\s*0;/s);
  assert.match(css, /\.trainer-content\s*{[^}]*padding:\s*0 14px 94px/s);
});
