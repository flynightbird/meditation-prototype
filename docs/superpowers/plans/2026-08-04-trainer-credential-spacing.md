# Trainer Credential Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the trainer Hero credential text more horizontal and vertical breathing room while softening the separators with transparent ends.

**Architecture:** Keep the existing credential markup and three-column grid. Change only the credential group's CSS measurements and separator paint, then lock the approved values in the existing trainer booking contract test.

**Tech Stack:** CSS, Node.js built-in test runner

---

### Task 1: Refine credential spacing and separators

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:65`
- Modify: `src/trainer-booking.css:209`

- [ ] **Step 1: Write the failing contract**

Update the existing credential layout assertion and add focused assertions for the new separator and subtitle spacing:

```js
assert.match(
  css,
  /\.trainer-credentials\s*{[^}]*position:\s*absolute[^}]*left:\s*22px[^}]*bottom:\s*28px[^}]*width:\s*204px[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[^}]*column-gap:\s*4px[^}]*list-style:\s*none/s,
);
assert.match(
  css,
  /\.trainer-credential \+ \.trainer-credential::before\s*{[^}]*top:\s*9px[^}]*left:\s*-2px[^}]*height:\s*34px[^}]*background:\s*linear-gradient\(\s*to bottom,\s*transparent 0%,\s*rgba\(255, 250, 243, 0\.16\) 28%,\s*rgba\(255, 250, 243, 0\.16\) 72%,\s*transparent 100%\s*\)/s,
);
assert.match(css, /\.trainer-credential small\s*{[^}]*margin-top:\s*5px/s);
```

Remove the old assertion that expects a flat `28px` separator and change the existing width expectation from `184px` to `204px`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="places three coach credentials" tests/trainer-booking-contract.test.js
```

Expected: FAIL because the current CSS still uses `184px`, has no column gap, keeps a flat `28px` separator, and uses `3px` subtitle spacing.

- [ ] **Step 3: Implement the approved CSS values**

Update `.trainer-credentials`:

```css
.trainer-credentials {
  width: 204px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 4px;
}
```

Keep the existing positioning, margin, padding, and list-style declarations unchanged.

Update the separator rule:

```css
.trainer-credential + .trainer-credential::before {
  top: 9px;
  left: -2px;
  width: 1px;
  height: 34px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 250, 243, 0.16) 28%,
    rgba(255, 250, 243, 0.16) 72%,
    transparent 100%
  );
}
```

Keep `position`, `content`, and all non-listed declarations unchanged.

Update the subtitle spacing:

```css
.trainer-credential small {
  margin-top: 5px;
}
```

Keep the existing subtitle color and font size unchanged.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="places three coach credentials" tests/trainer-booking-contract.test.js
npm test
git diff --check
```

Expected: focused test passes, all tests pass, and `git diff --check` produces no output.

- [ ] **Step 5: Verify both mobile viewports**

Open the trainer page at `375x812` and `402x874`. Confirm all three titles and subtitles remain on one line, the group does not create horizontal overflow, the separators fade at both ends, and the widened group does not overlap the trainer image incoherently.

- [ ] **Step 6: Commit**

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: loosen trainer credential spacing"
```
