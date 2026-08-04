# Trainer Store Cell Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize trainer-page store cells for clearer sequence, priority, address, distance, hours, and feature hierarchy while refining the booking helper color and credential spacing.

**Architecture:** Keep the static store data and existing three-row article list. Restructure each article into a sequence marker, a semantic copy group, and a right-side distance module; apply all presentation through the existing trainer stylesheet and lock the result in the existing contract test.

**Tech Stack:** HTML, CSS, Node.js built-in test runner

---

### Task 1: Polish trainer store information hierarchy

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:93`
- Modify: `index.html:234`
- Modify: `src/trainer-booking.css:215,318,479`

- [ ] **Step 1: Write the failing contract**

Add this test after `links the complete store row to map navigation`:

```js
test("polishes store hierarchy and supporting trainer details", () => {
  assert.match(html, /<b aria-hidden="true">01<\/b>/);
  assert.match(html, /<b aria-hidden="true">02<\/b>/);
  assert.match(html, /<b aria-hidden="true">03<\/b>/);
  assert.equal((html.match(/class="store-nearest"/g) ?? []).length, 1);
  assert.match(html, /class="store-nearest">最近<\/span>[\s\S]*南浦大桥店/);
  assert.match(html, /<p>南浦一路111号一层<\/p>/);
  assert.match(html, /class="store-hours">10:00–24:00<\/span>/);
  assert.match(html, /class="store-features">私教体验 · 体态检测<\/span>/);
  assert.match(html, /class="store-distance">[\s\S]*756m[\s\S]*›[\s\S]*<\/span>/);
  assert.doesNotMatch(html, /756m · 南浦一路111号一层/);

  assert.match(
    css,
    /\.store-row\s*{[^}]*grid-template-columns:\s*20px minmax\(0, 1fr\) auto[^}]*min-height:\s*82px/s,
  );
  assert.match(
    css,
    /\.store-row > b\s*{[^}]*font-variant-numeric:\s*tabular-nums[^}]*color:\s*rgba\(255, 250, 243, 0\.3\)[^}]*font-size:\s*10px/s,
  );
  assert.match(
    css,
    /\.store-nearest\s*{[^}]*border:\s*1px solid rgba\(248, 213, 83, 0\.22\)[^}]*color:\s*#f8d553[^}]*background:\s*rgba\(248, 213, 83, 0\.1\)[^}]*font-size:\s*8px/s,
  );
  assert.match(css, /\.store-distance\s*{[^}]*display:\s*inline-flex[^}]*gap:\s*3px[^}]*align-self:\s*center[^}]*font-size:\s*10px/s);
  assert.match(css, /\.store-distance i\s*{[^}]*font-size:\s*16px/s);
  assert.match(css, /\.store-hours\s*{[^}]*color:\s*rgba\(255, 250, 243, 0\.34\)[^}]*font-size:\s*9px[^}]*font-weight:\s*400/s);
  assert.match(css, /\.store-features\s*{[^}]*color:\s*rgba\(255, 250, 243, 0\.58\)[^}]*font-size:\s*9\.5px[^}]*font-weight:\s*500/s);
  assert.match(css, /\.booking-heading span\s*{[^}]*color:\s*var\(--trainer-text-muted\)/s);
  assert.match(css, /\.trainer-credential-icon\s*{[^}]*margin:\s*0 auto 7px/s);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="polishes store hierarchy" tests/trainer-booking-contract.test.js
```

Expected: FAIL because the sequence, nearest tag, split distance module, and new visual hierarchy do not exist.

- [ ] **Step 3: Restructure all three store rows**

Replace the existing `.store-list` contents with:

```html
<div class="store-list">
  <article class="store-row">
    <b aria-hidden="true">01</b>
    <div class="store-copy">
      <h3><span class="store-nearest">最近</span><span>南浦大桥店</span><em>营业中</em></h3>
      <p>南浦一路111号一层</p>
      <small>
        <span class="store-hours">10:00–24:00</span>
        <span class="store-detail-separator" aria-hidden="true">·</span>
        <span class="store-features">私教体验 · 体态检测</span>
      </small>
    </div>
    <span class="store-distance"><span>756m</span><i aria-hidden="true">›</i></span>
  </article>
  <article class="store-row">
    <b aria-hidden="true">02</b>
    <div class="store-copy">
      <h3><span>前海湾旗舰店</span><em>营业中</em></h3>
      <p>前海路99号B1层</p>
      <small>
        <span class="store-hours">09:00–22:00</span>
        <span class="store-detail-separator" aria-hidden="true">·</span>
        <span class="store-features">私教体验 · 停车方便</span>
      </small>
    </div>
    <span class="store-distance"><span>2.8km</span><i aria-hidden="true">›</i></span>
  </article>
  <article class="store-row is-closed">
    <b aria-hidden="true">03</b>
    <div class="store-copy">
      <h3><span>海上世界店</span><em>已打烊</em></h3>
      <p>望海路1187号商业中心</p>
      <small>
        <span class="store-hours">10:00–21:30</span>
        <span class="store-detail-separator" aria-hidden="true">·</span>
        <span class="store-features">体态检测 · 停车方便</span>
      </small>
    </div>
    <span class="store-distance"><span>4.1km</span><i aria-hidden="true">›</i></span>
  </article>
</div>
```

- [ ] **Step 4: Implement the approved CSS hierarchy**

Change the credential margin and booking helper color, then replace the store-row style block with:

```css
.trainer-credential-icon {
  display: grid;
  width: 26px;
  height: 26px;
  margin: 0 auto 7px;
  place-items: center;
  border: 1px solid rgba(255, 236, 200, 0.14);
  border-radius: 50%;
  color: rgba(248, 213, 83, 0.78);
  background: rgba(255, 248, 230, 0.075);
}

.booking-heading span {
  color: var(--trainer-text-muted);
  font-size: 10px;
}

.store-list { padding: 0 16px 8px; }

.store-row {
  display: grid;
  min-height: 82px;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.store-list .store-row:first-child { border-top: 0; }

.store-row > b {
  width: 20px;
  color: rgba(255, 250, 243, 0.3);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  text-align: center;
}

.store-copy { min-width: 0; }

.store-row h3 {
  display: flex;
  min-width: 0;
  margin: 0 0 4px;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
}

.store-nearest {
  padding: 2px 5px;
  border: 1px solid rgba(248, 213, 83, 0.22);
  border-radius: 5px;
  color: #f8d553;
  background: rgba(248, 213, 83, 0.1);
  font-size: 8px;
  line-height: 1.2;
}

.store-row h3 em {
  padding: 2px 5px;
  border-radius: 5px;
  color: #f8d553;
  background: rgba(248, 213, 83, 0.1);
  font-size: 8px;
  font-style: normal;
}

.store-row p {
  margin: 0;
  overflow: hidden;
  color: rgba(255, 250, 243, 0.46);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-row small {
  display: flex;
  min-width: 0;
  margin-top: 5px;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.store-hours {
  color: rgba(255, 250, 243, 0.34);
  font-size: 9px;
  font-weight: 400;
}

.store-detail-separator { color: rgba(255, 250, 243, 0.22); }

.store-features {
  overflow: hidden;
  color: rgba(255, 250, 243, 0.58);
  font-size: 9.5px;
  font-weight: 500;
  text-overflow: ellipsis;
}

.store-distance {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  align-self: center;
  color: var(--trainer-text-muted);
  font-size: 10px;
  white-space: nowrap;
}

.store-distance i {
  font-size: 16px;
  font-style: normal;
  line-height: 1;
}

.store-row.is-closed { opacity: 0.56; }

.store-row.is-closed > b { color: rgba(232, 224, 214, 0.48); }
```

- [ ] **Step 5: Verify GREEN and the full suite**

Run:

```bash
node --test --test-name-pattern="polishes store hierarchy" tests/trainer-booking-contract.test.js
npm test
git diff --check
```

Expected: the focused contract passes, all project tests pass, and `git diff --check` emits no output.

- [ ] **Step 6: Verify the live trainer page**

Reload `http://127.0.0.1:4176/` and inspect at `375x812` and `402x874`.

Expected: all three title/detail rows remain single-line; only the first store shows `最近`; the right-side distance module is vertically centered without overlap; the closed store remains subdued; `未来 7 天` matches the nearby summary color; the credential icon-title gap is 7px; there is no horizontal overflow or console error.

- [ ] **Step 7: Commit the implementation**

```bash
git add index.html src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: refine trainer store cells"
```
