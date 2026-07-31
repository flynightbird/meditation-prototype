# Home Carousel And Reward Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the meditation home with a six-item horizontal schedule, compact growth cue, daily streak welcome, rounded display typography, automatic tent claiming, optional feedback, and an in-place transition to the next task.

**Architecture:** Keep the existing vanilla JavaScript state machine as the source of truth. Add pure experience helpers for greeting, daily persistence, and schedule data; render the welcome and reward choreography as transient UI phases driven by explicit state events and timers.

**Tech Stack:** Semantic HTML, CSS, vanilla JavaScript, Node.js built-in test runner, localStorage, agent-browser.

---

### Task 1: State transitions and experience helpers

**Files:**
- Modify: `src/state-machine.js`
- Create: `src/experience.js`
- Modify: `tests/state-machine.test.js`
- Create: `tests/experience.test.js`

- [ ] Add failing tests for automatic claim, feedback confirmation, feedback timeout, interrupted claim resume, time-aware greetings, daily welcome visibility, and the six-item schedule.
- [ ] Run `npm test` and confirm failures are caused by missing events and helpers.
- [ ] Add `CLAIM_COMPLETE`, `SELECT_MOOD`, `FEEDBACK_COMPLETE`, `SKIP_FEEDBACK`, and `RESUME_CLAIM_COMPLETE` transitions.
- [ ] Add pure helpers for local date keys, greeting copy, welcome eligibility, and schedule variants.
- [ ] Run `npm test` and confirm all state and helper tests pass.

### Task 2: Home structure and daily welcome

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Create: `assets/rounded-display.woff2`

- [ ] Add the full-screen welcome layer with accessible skip behavior.
- [ ] Load a local open-source rounded display font and restrict it to the greeting and main heading.
- [ ] Implement time-aware greeting, once-per-local-day persistence, center-to-header streak motion, one light haptic, and reduced-motion fallback.
- [ ] Replace the stable recommendation title with the approved status-oriented hierarchy and compact `168x56px` CTA.
- [ ] Replace the long growth bar with the single-line four-dot growth cue.

### Task 3: Horizontal task rail

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] Render six chronological task cards from shared schedule data.
- [ ] Implement an edge-to-edge horizontal scroll rail with scroll snap, hidden scrollbar, edge peeking, and initial centering on the current card.
- [ ] Keep current, future, and completed cards semantically distinct through stable dimensions, frosted surfaces, gray treatment, and completion labels.
- [ ] After the meditation flow, demote meditation to completed and promote fitness to the large current card, then center it once.

### Task 4: Automatic tent claim and feedback transition

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] On meditation completion, enter reward state without showing feedback first.
- [ ] Animate the tent inside a circular light halo, move it into the room, and emit 8-12 warm petal particles.
- [ ] Persist `claiming` before motion and `claimed` after landing; resume an interrupted claim with the approved short animation.
- [ ] Show the optional three-choice feedback after reward; move to the next task immediately after selection or automatically after five seconds.
- [ ] Keep the room fixed while message, IP pose, feedback, and task rail transition in place.
- [ ] Keep reward history closed by default and remove the new marker after the first tent click.

### Task 5: Verification

**Files:**
- Modify only when verification reveals defects.

- [ ] Run `npm test` and syntax checks.
- [ ] Use agent-browser at `402x874` to verify first visit, second visit, skip, timer, automatic claim, feedback answer, feedback timeout, task carousel, reminder, and tent detail.
- [ ] Verify `375x812`, touch targets, horizontal overflow containment, reduced motion, and console errors.
- [ ] Capture screenshots for recommendation, welcome, active meditation, claim preview, feedback, and next-task states.
