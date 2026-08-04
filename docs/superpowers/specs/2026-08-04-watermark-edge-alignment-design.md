# Video Watermark Edge Alignment Design

## Goal

Move the two existing video watermark blur masks horizontally against their respective media edges without changing the approved blur treatment.

## Layout

- The top-left mask uses `left: 0` and keeps `top: var(--watermark-mask-inset)`.
- The bottom-right mask uses `right: 0` and keeps `bottom: var(--watermark-mask-inset)`.
- The rule applies equally to the visible full-screen app video and all five desktop portfolio videos.

## Unchanged Treatment

- Blur remains `8px`.
- Mask size remains `17%` by `5.5%`.
- The translucent fallback tint remains unchanged.
- Elliptical soft-edge gradients, stacking, and `pointer-events: none` remain unchanged.
- The hidden video preloader remains excluded.

## Verification

- Update the visual contract first and confirm it fails against the current inset positioning.
- Apply the minimal CSS positioning change and confirm the focused and full test suites pass.
- Recheck the app at `402x874` and the five portfolio videos at `1440x1000`.
- Confirm each mask touches its horizontal edge while retaining its vertical inset, and that no watermark, UI, caption, or video control is exposed or obstructed.
