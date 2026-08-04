# Trainer Credential Ring Refinement

## Goal

Reduce the visual weight of the three credential icons so they support the trainer identity without competing with the booking cards.

## Approved Direction

Use the same warm translucent material family as the booking and nearby-store cards:

- Replace the gold conic-gradient ring with a single attached `1px` warm-white border.
- Use the existing warm glass color, `rgba(255, 248, 230, 0.075)`, as the circle background.
- Set the circle border to 14% opacity: `rgba(255, 236, 200, 0.14)`.
- Keep the icons gold for recognition, but lower their brightness with `rgba(248, 213, 83, 0.78)`.
- Remove the ring pseudo-element, mask, gradient, and related positioning that no longer serve the design.

## Scope

Only the credential icon material changes. Keep the current `26px` circle size, icon size, three-column layout, spacing, copy, separators, booking-panel position, and trainer light band unchanged.

## Verification

- The visual contract must reject the previous conic-gradient ring and require the approved warm glass background, low-opacity border, and softened gold icon color.
- The trainer page must retain its current layout without overflow or wrapping at the validated mobile widths.
- The browser console must remain free of warnings and errors.
