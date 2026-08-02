# Task Card Spacing and Radius Refinement

## Scope

Refine the bottom task rail without changing card dimensions, content, scrolling behavior, or state transitions.

## Visual Changes

- Reduce the horizontal gap between adjacent task cards from `10px` to `4px`.
- Increase the corner radius on every task card from `12px` to `14px`.
- Keep the current card and the compact cards on the same corner-radius system.

## Implementation

Change only the `.task-rail` `gap` value and the `.task-card` `border-radius` value in `src/styles.css`. Preserve all other existing styles and current uncommitted work.

## Verification

- Run the existing automated test suite.
- Check the task rail at 375 x 812 and 402 x 874 viewports.
- Confirm that cards remain visually separate, horizontal scrolling remains usable, and no card content overlaps or clips.

## Acceptance Criteria

- The visible gap between adjacent task cards is `4px`.
- Every task card uses a `14px` corner radius.
- Card sizing, internal layout, current-card emphasis, and task-rail behavior are unchanged.
