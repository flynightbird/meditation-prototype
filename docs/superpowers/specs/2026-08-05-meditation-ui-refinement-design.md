# Meditation UI Refinement Design

## Goal

Reduce visual competition during the meditation countdown, improve the message hierarchy, and make collectible growth bubbles easier to identify.

## Countdown Growth Stats

- Hide the three right-side growth stats only while `data-screen="active"`, which is the 20-second meditation countdown.
- Keep the existing elements mounted so their layout and values do not need to be rebuilt.
- Use opacity and visibility for a restrained transition.
- Set `aria-hidden="true"` during the active screen and restore `aria-hidden="false"` immediately when the app enters completion.
- Do not hide the stats during recommendation, completion, reward, meal preparation, meal time, or trainer views beyond their existing trainer-specific behavior.

## Message Spacing

- Increase the spacing between a message title and a directly following supporting paragraph from `3px` to `8px`.
- Scope the change to `.message h1 + .supporting` so existing title/time-label/supporting combinations keep their current rhythm.

## Growth Bubble Labels

- Reuse the existing vitality, focus, and stamina icon assets from the growth-stat model.
- Render the first bubble row as decorative icon plus attribute label.
- Use a `12px` icon and `3px` horizontal gap.
- Keep the existing reward value on the second row.
- Icons use empty alternative text because the adjacent visible label and existing button `aria-label` already provide the meaning.

## Verification

- Automated contracts verify active-only stat hiding, accessibility state updates, the `8px` adjacent title spacing, and icon-plus-label bubble markup with a `3px` gap.
- Browser verification covers recommendation, active countdown, completion, and visible reward bubbles at `402x874`.
- Confirm growth stats restore immediately after countdown completion, message content does not overlap, and bubble labels remain legible inside their fixed circular bounds.
