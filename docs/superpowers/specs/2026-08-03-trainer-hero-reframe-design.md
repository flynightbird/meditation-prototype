# Trainer Hero Reframe Design

## Goal

Strengthen the trainer booking Hero composition while preserving the approved warm-charcoal visual system, readable coach identity, booking-card geometry, and existing behavior.

## Approved Direction

Use the selected B2 composition:

- Increase the trainer image from `150%` to `175%` of the 320px Hero height.
- Move the trainer image down by exactly 40px, changing `top` from `24px` to `64px`.
- Move the trainer image right to `right: -112px`, visually hiding about two-fifths of the right arm.
- Keep `width: auto`, `object-fit: contain`, and `object-position: right top` so the source image is never distorted.
- Keep the trainer image behind the store label and coach identity. The head remains visible and the image must not obscure `李教练` or `已陪伴训练 16 次`.

## Lower-Body Treatment

Retain the existing Hero shade and add a stronger lower overlay through `.trainer-hero-shade::after`:

- Start at `top: 220px` within the Hero.
- Use a `400px` overlay height so it covers the enlarged trainer through the card gap and image bottom.
- Fade from transparent to the approved warm charcoal `rgba(23, 20, 17, 0.94)` by `38%`, then hold that color through the overlay bottom.
- Keep the overlay below `.trainer-store` and `.trainer-identity`, which remain at `z-index: 1`.
- Keep the booking content at `z-index: 2`, so the overlay cannot cover the booking controls.

This is intentionally a page-level lower overlay rather than an image mask. It darkens the lower Hero transition as selected in B2 and avoids changing the trainer asset itself.

## Store Divider

Remove only the horizontal divider immediately below the map by setting the first `.store-row` in `.store-list` to `border-top: 0`. Preserve separators between the remaining store rows.

## Unchanged Scope

- Warm-charcoal page gradient, glass cards, yellow accents, and Dock colors
- Hero height and coach identity positions
- Booking card dimensions, dates, times, action bar, dialog, and booking state
- Map image, map pins, store content, and navigation behavior
- Six-tab Dock layout and transitions

## Verification

- Extend the trainer booking CSS contract to require `height: 175%`, `right: -112px`, and `top: 64px`.
- Add contracts for the B2 lower overlay and first-store divider removal.
- Run the focused trainer booking contract and the full repository test suite.
- Verify at `375x812` and `402x874` that the page has no horizontal overflow, the head remains visible, identity copy is unobstructed, the right arm is substantially cropped, the lower body fades before the booking card, and only the first store divider is removed.
