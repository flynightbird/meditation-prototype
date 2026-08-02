# Bottom Schedule Density Refinement

## Scope

Refine the bottom task rail and navigation density without changing card content, scrolling behavior, navigation structure, or state transitions.

## Visual Changes

- Reduce the horizontal gap between adjacent task cards from `10px` to `4px`.
- Increase the corner radius on every task card from `12px` to `14px`.
- Keep the current card and the compact cards on the same corner-radius system.
- Reduce compact task cards from `90 x 72px` to `88 x 70px`.
- Reduce the current task card from `150 x 90px` to `146 x 88px`.
- Reduce the task rail from `102px` to `98px`, coordinating its padding with the current-card height so the card is not clipped.
- Reduce the bottom navigation from `74px` to `70px` while preserving a touch target larger than the 44px minimum.

## Implementation

Change the dimensions, spacing, and corner radius in the existing `.task-rail`, `.task-card`, `.task-card.is-current`, and `.bottom-nav` rules in `src/styles.css`. Keep the task rail 6px above the navigation and retain approximately 11px of visible separation between the bottom of the current card and the top of the navigation. Preserve all other existing styles and current uncommitted work.

## Verification

- Run the existing automated test suite.
- Check the task rail at 375 x 812 and 402 x 874 viewports.
- Confirm that cards remain visually separate, horizontal scrolling remains usable, and no card content overlaps or clips.

## Acceptance Criteria

- The visible gap between adjacent task cards is `4px`.
- Every task card uses a `14px` corner radius.
- Compact task cards are `88 x 70px`.
- The current task card is `146 x 88px`.
- The task rail is `98px` high and does not clip either card size.
- The bottom navigation is `70px` high and its items remain at least 44px tall.
- Internal card layout, current-card emphasis, scrolling behavior, and navigation behavior remain unchanged.
