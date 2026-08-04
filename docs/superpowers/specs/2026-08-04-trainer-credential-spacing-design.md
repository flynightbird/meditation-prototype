# Trainer Credential Spacing Design

## Goal

Reduce visual crowding in the trainer Hero credential group while preserving its current three-column structure, typography, icon treatment, and position relative to the trainer image.

## Approved Layout

- Increase `.trainer-credentials` width from `184px` to `204px`.
- Add a `4px` column gap between the three equal grid columns.
- Keep the credential group at `left: 22px` and `bottom: 28px`.
- Keep all three credentials on one row.

## Text Spacing

- Increase the credential subtitle top margin from `3px` to `5px`.
- Keep the current `10px` title size, `8px` subtitle size, regular weight, and `1.2` line height.
- Keep the existing `7px` gap between each circular icon and its title.

## Separator Treatment

Keep one separator between adjacent credentials, but replace the flat fill with a vertical fade:

```css
background: linear-gradient(
  to bottom,
  transparent 0%,
  rgba(255, 250, 243, 0.16) 28%,
  rgba(255, 250, 243, 0.16) 72%,
  transparent 100%
);
```

- Set the separator to `34px` high and position it at `top: 9px`.
- Align each separator inside the new column gap so it does not touch the icon or text.
- The middle remains restrained; both ends fade fully to transparent.

## Preserved Behavior

- Do not change credential copy, SVG artwork, circle size, circle color, or background.
- Do not move the trainer image, identity block, booking panel, or nearby-store panel.
- Do not add animation or interaction to the credential group.

## Verification

- Contract-test the `204px` width, `4px` column gap, `5px` subtitle spacing, and gradient separator stops.
- Verify at `375x812` and `402x874` that all text remains visible and on one line.
- Confirm the credential group does not create horizontal overflow or an incoherent overlap with the trainer image.

## Out Of Scope

- Credential content changes
- Typography or icon redesign
- Hero layout or trainer-image repositioning
- Responsive breakpoint changes outside the two supported mobile checks
