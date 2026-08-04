# Video Watermark Edge Alignment Design

## Goal

Move the two existing video watermark blur masks horizontally against their respective media edges while preserving their geometry, vertical inset, blur, and tint.

## Layout

- The top-left mask uses `left: 0` and keeps `top: var(--watermark-mask-inset)`.
- The bottom-right mask uses `right: 0` and keeps `bottom: var(--watermark-mask-inset)`.
- The rule applies to the visible full-screen app video. The desktop portfolio showcase is no longer part of the published application.

## Unchanged Treatment

- Blur remains `8px`.
- Mask size remains `17%` by `5.5%`.
- The translucent fallback tint remains unchanged.
- The elliptical shape, stacking, and `pointer-events: none` remain unchanged. As a visual-QA correction, the gradient stops are refined to opaque through `24%`, `rgba(0, 0, 0, 0.72)` at `48%`, and transparent at `88%` so edge alignment does not create a pale tab.
- The hidden video preloader remains excluded.

## Verification

- Update the visual contract first and confirm it fails against the current inset positioning.
- Apply the approved positioning and gradient changes and confirm the focused and full test suites pass.
- Recheck the app at `402x874`.
- Confirm each mask touches its horizontal edge while retaining its vertical inset, and that no watermark, UI, caption, or video control is exposed or obstructed.
