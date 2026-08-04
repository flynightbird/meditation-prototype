# Video Watermark Blur Design

## Goal

Obscure Doubao marks located in the top-left and bottom-right corners of every visible product video without materially dimming the video, blocking controls, or covering app content.

## Scope

The treatment applies to:

- The full-screen application scene video (`#sceneVideo`).
- All five portfolio experience clips (`.portfolio-video`).

The hidden preload video is excluded because it is never visible.

## Visual Treatment

- Add one blur region at the top-left and one at the bottom-right of each visible video container.
- Use the approved light treatment: `backdrop-filter: blur(8px)` with the matching `-webkit-backdrop-filter` declaration.
- Size each region at `17%` of the video width and `5.5%` of the video height so it scales with both the mobile app and desktop portfolio clips.
- Inset each region `1.2%` from its horizontal and vertical corner edges to cover the complete mark.
- Fade the inner-facing edges with a CSS mask so the treatment blends into the live video instead of reading as a hard rectangular patch.
- Use `rgba(20, 16, 13, 0.08)` as the translucent fallback tint. The blur must preserve the existing warm video color rather than create a dark block.

## Structure And Layering

Use container pseudo-elements instead of adding repeated markup:

- `.app-shell::before` and `.app-shell::after` cover the full-screen scene video.
- `.portfolio-clip::before` and `.portfolio-clip::after` cover each portfolio video.

The full-screen masks appear only while `.app-shell` has visible media. They use `z-index: 3`, above the scene video and atmosphere but below the header, task content, controls, reward UI, transitions, and navigation.

The portfolio masks use `z-index: 1`, above each video and below the existing `z-index: 2` caption. Both variants use `pointer-events: none` so they cannot block any interaction.

## Browser Fallback

Browsers without backdrop-filter support retain a subtle translucent corner cover. The fallback must still reduce watermark legibility without materially changing the surrounding image.

## Accessibility And Motion

- The masks are decorative pseudo-elements and add no accessibility-tree content.
- The treatment contains no animation and does not need a reduced-motion variant.
- Video controls and focus behavior remain unchanged.

## Verification

Automated visual-contract tests must verify:

- Both full-screen corner masks exist only with visible media.
- Both portfolio corner masks are present on every clip through the shared container rules.
- Blur strength is exactly `8px` with the WebKit fallback.
- The masks use proportional dimensions, soft-edge masking, non-interactive pointer behavior, and the intended stacking order.

Browser verification must cover:

- The full-screen app at `375x812` and `402x874`.
- The desktop portfolio grid at a wide viewport.
- At least one bright and one dark video frame to confirm the mark is obscured without a conspicuous corner block.
- Navigation, task controls, portfolio captions, and native video controls remain usable and visually above the masks.
