# Trainer Credential Ring Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three trainer credential gold gradient rings with restrained warm glass circles and low-opacity borders.

**Architecture:** Keep the existing semantic credential markup and layout unchanged. Update the CSS-only material treatment and lock the approved colors plus gradient removal in the existing trainer booking visual contract.

**Tech Stack:** HTML, CSS, Node.js built-in test runner

---

### Task 1: Refine credential icon material

**Files:**
- Modify: `tests/trainer-booking-contract.test.js:79`
- Modify: `src/trainer-booking.css:215`

- [ ] **Step 1: Write the failing visual contract**

Replace the credential icon assertions in `adds restrained depth and breathing room to the trainer Hero` with:

```js
assert.match(
  css,
  /\.trainer-credential-icon\s*{[^}]*border:\s*1px solid rgba\(255, 236, 200, 0\.14\)[^}]*color:\s*rgba\(248, 213, 83, 0\.78\)[^}]*background:\s*rgba\(255, 248, 230, 0\.075\)/s,
);
assert.doesNotMatch(css, /\.trainer-credential-icon::before\s*{/);
assert.doesNotMatch(css, /\.trainer-credential-icon[\s\S]*?conic-gradient\(/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="adds restrained depth" tests/trainer-booking-contract.test.js
```

Expected: FAIL because the production CSS still has `border: 0`, the dark background, and the conic-gradient pseudo-element.

- [ ] **Step 3: Implement the approved warm glass material**

Replace the current `.trainer-credential-icon` rule and remove its `::before` rule so the remaining rule is:

```css
.trainer-credential-icon {
  display: grid;
  width: 26px;
  height: 26px;
  margin: 0 auto 5px;
  place-items: center;
  border: 1px solid rgba(255, 236, 200, 0.14);
  border-radius: 50%;
  color: rgba(248, 213, 83, 0.78);
  background: rgba(255, 248, 230, 0.075);
}
```

- [ ] **Step 4: Verify GREEN and run the full suite**

Run:

```bash
node --test --test-name-pattern="adds restrained depth" tests/trainer-booking-contract.test.js
npm test
git diff --check
```

Expected: the focused contract passes, all project tests pass, and `git diff --check` emits no output.

- [ ] **Step 5: Verify the live trainer page**

Reload `http://127.0.0.1:4176/` and inspect the trainer page at `375x812` and `402x874`.

Expected: all three circles use the subtle warm glass material; no gold gradient ring remains; credential copy does not wrap; the group does not overlap the identity or booking panel; there is no horizontal overflow; the browser console contains no warnings or errors.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/trainer-booking.css tests/trainer-booking-contract.test.js
git commit -m "style: soften trainer credential icons"
```
