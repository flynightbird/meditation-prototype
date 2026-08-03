# Trainer Credentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved three-column coach credential group to the lower-left gap between the trainer identity and booking panel.

**Architecture:** Add one static semantic list as a sibling of `.trainer-identity` inside `.trainer-hero`. Style it as a separately positioned, non-interactive overlay constrained to the left 184 px of the Hero so it occupies the approved orange-box area without changing the booking flow or covering the trainer's arm.

**Tech Stack:** Static HTML, CSS, Node.js test runner, in-app browser visual verification.

---

## File Map

- Modify `index.html`: add semantic credential markup and inline decorative SVG icons.
- Modify `src/trainer-booking.css`: position and style the three-column credential group.
- Modify `tests/trainer-booking-contract.test.js`: lock approved content, semantics, placement, and visual constraints.

### Task 1: Add the trainer credential group

**Files:**
- Modify: `index.html`
- Modify: `src/trainer-booking.css`
- Test: `tests/trainer-booking-contract.test.js`

- [ ] **Step 1: Write the failing contract test**

Add this test to `tests/trainer-booking-contract.test.js`:

```js
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/trainer-booking-contract.test.js --test-name-pattern="places three coach credentials"
```

Expected: FAIL because `.trainer-credentials` does not exist.

- [ ] **Step 3: Add the semantic credential markup**

In `index.html`, insert this list after `.trainer-identity` and before `.trainer-hero-cut`:

```html
<ul class="trainer-credentials" aria-label="教练资质">
  <li class="trainer-credential">
    <span class="trainer-credential-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-2.8 7.5-7 10-4.2-2.5-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>
    </span>
    <strong>专业认证</strong>
    <small>NASM-CPT</small>
  </li>
  <li class="trainer-credential">
    <span class="trainer-credential-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M6 9v6M9 7v10M15 7v10M18 9v6M9 12h6M3 10v4M21 10v4"/></svg>
    </span>
    <strong>减脂塑形</strong>
    <small>专项训练</small>
  </li>
  <li class="trainer-credential">
    <span class="trainer-credential-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M5 19V12M12 19V5M19 19V9"/></svg>
    </span>
    <strong>科学指导</strong>
    <small>定制计划</small>
  </li>
</ul>
```

- [ ] **Step 4: Style the approved C layout in the orange-box area**

Add this after `.trainer-identity p` in `src/trainer-booking.css`:

```css
.trainer-credentials {
  position: absolute;
  z-index: 2;
  left: 22px;
  bottom: 28px;
  display: grid;
  width: 184px;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
}

.trainer-credential {
  position: relative;
  min-width: 0;
  text-align: center;
}

.trainer-credential + .trainer-credential::before {
  position: absolute;
  top: 12px;
  left: 0;
  width: 1px;
  height: 28px;
  background: rgba(255, 250, 243, 0.18);
  content: "";
}

.trainer-credential-icon {
  display: grid;
  width: 26px;
  height: 26px;
  margin: 0 auto 5px;
  place-items: center;
  border: 1px solid rgba(248, 213, 83, 0.72);
  border-radius: 50%;
  color: #f8d553;
}

.trainer-credential-icon svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trainer-credential strong,
.trainer-credential small {
  display: block;
  overflow: hidden;
  font-weight: 400;
  line-height: 1.2;
  text-overflow: clip;
  white-space: nowrap;
}

.trainer-credential strong {
  color: rgba(255, 250, 243, 0.9);
  font-size: 10px;
}

.trainer-credential small {
  margin-top: 3px;
  color: rgba(255, 250, 243, 0.5);
  font-size: 8px;
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/trainer-booking-contract.test.js --test-name-pattern="places three coach credentials"
```

Expected: PASS.

- [ ] **Step 6: Run the complete test suite**

Run:

```bash
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 7: Commit the implementation**

```bash
git add index.html src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "feat: add trainer credential highlights"
```

### Task 2: Verify responsive placement

**Files:**
- Verify: `index.html`
- Verify: `src/trainer-booking.css`

- [ ] **Step 1: Open the trainer screen at 375 x 812**

Use the running local preview at `http://127.0.0.1:4174/`, select `预约私教`, and inspect the Hero.

Expected: all three credentials are in one row inside the lower-left gap; the group does not cover the experience copy or booking panel.

- [ ] **Step 2: Measure layout bounds at 375 x 812**

Read the bounding rectangles for `.trainer-credentials`, `.trainer-identity`, `.booking-panel`, and the page viewport.

Expected: credential left edge is 22 px, width is 184 px, its top is below the identity paragraph, its bottom is above the booking panel, and document width does not exceed viewport width.

- [ ] **Step 3: Repeat at 402 x 874**

Expected: the same one-row structure remains stable with no wrapping, clipping, or overlap.

- [ ] **Step 4: Check runtime diagnostics**

Inspect browser console warnings/errors and run:

```bash
git diff --check
```

Expected: zero console issues and no whitespace errors.
