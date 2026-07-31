# Meditation Home Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile interactive HTML prototype that demonstrates the meditation recommendation, active timer, completion reflection, room-growth reward, and next-task loop.

**Architecture:** A small state-machine module owns interaction transitions and timer formatting. A single mobile app shell renders each state over shared room and IP assets, while CSS controls the vertical enter/exit motion and responsive framing.

**Tech Stack:** Semantic HTML, CSS, vanilla JavaScript, Node.js built-in test runner, agent-browser for mobile interaction verification.

---

### Task 1: State machine

**Files:**
- Create: `package.json`
- Create: `tests/state-machine.test.js`
- Create: `src/state-machine.js`

- [x] Write failing tests for the recommendation, active, reflection, reward, and next-task transitions.
- [x] Run `npm test` and verify the missing module failure.
- [x] Implement the minimal state machine and timer formatter.
- [x] Run `npm test` and verify all transition tests pass.

### Task 2: Mobile app shell

**Files:**
- Create: `index.html`
- Create: `src/styles.css`
- Create: `src/app.js`
- Create: `assets/*`

- [x] Copy the supplied room, IP, task, navigation, capsule, and reward assets using stable ASCII names.
- [x] Build the shared full-bleed room scene and accessible controls.
- [x] Render state-specific content from the state machine without page navigation.
- [x] Add upward/downward content transitions, IP pose changes, countdown controls, reflection choices, and reward reveal.

### Task 3: Verification

**Files:**
- Modify only if verification identifies a defect.

- [x] Run `npm test`.
- [x] Start the local static server.
- [x] Use agent-browser at a 402x874 viewport to exercise the full state flow.
- [x] Capture screenshots for recommendation, active meditation, reflection, and reward states.
- [x] Check mobile text fit, hit targets, timer controls, and reduced-motion behavior.
