# Task Card Visual Refinement

## Scope

Refine the existing 402 x 874 meditation homepage without adding product behavior. The change is limited to recommendation copy weight, task-card internals, current-card material, and vertical spacing between the primary action and task rail.

## Recommendation Copy

- Keep the current font size and line height.
- Set the supporting recommendation text to font weight 400.
- Preserve the current white color and text shadow so it remains readable over the room image.

## Task Card Layout

All cards use fixed internal rows so dynamic labels cannot overlap:

1. Metadata row at the top.
2. Icon area in the middle.
3. Task name at the bottom.

The icon and task name have a 2px visual gap. Completed cards keep the checkmark at the right edge of the name row, with reserved horizontal space so the mark never covers the text.

## Current Card

- Use the approved three-layer layout.
- Place time on the left and the `当前` label on the right.
- Keep a colored background behind the `当前` label.
- Move the icon upward slightly and enlarge it.
- Keep the task name centered in its own bottom row.
- Remove the yellow outer outline.
- Use a diagonal 135-degree translucent gradient from `#FFF18A` to `#D4F3FF`.
- Preserve the frosted fluid-glass treatment through blur, saturation, a subtle inner highlight, and a restrained shadow.

## Other Cards

- Use a 60% translucent white frosted surface.
- Completed cards remain desaturated and lower opacity.
- Upcoming cards remain fully legible and visually quieter than the current card.

## Vertical Rhythm

- Increase the clear gap between the `开始冥想` button and the top of the current task card to approximately 14px.
- Keep the existing bottom navigation position and task-rail height.
- Verify the spacing at both 402 x 874 and 375 x 812 viewports.

## Acceptance Criteria

- No task icon, task name, status label, or completion mark overlaps.
- The current card remains centered and visibly primary without an outer outline.
- Supporting recommendation text renders at weight 400.
- The primary button and current card have at least 14px of clear visual separation.
- Horizontal schedule browsing and all existing state transitions continue to work.
