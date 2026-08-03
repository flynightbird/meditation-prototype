# Trainer Navigation And Bubble Motion Design

## Scope

Refine the existing private-trainer hero and home growth bubbles without changing booking state, task rewards, card dimensions, or the trainer page visual foundation.

## Trainer Hero

- Move the existing full-body trainer image upward by 24px, changing its vertical position from `top: 64px` to `top: 40px`.
- Preserve the current image scale, right offset, and lower-body fade treatment.
- Replace the supporting copy below `李教练` with `减脂塑形教练 · 8年经验`.

## Store Navigation

- Keep the current store label: `中田健身 · 南山旗舰店`.
- Make the complete store row a single link rather than limiting the target to an icon.
- Open a Gaode Maps search for the existing store name in Shenzhen in a new browser context.
- Add a refined, thin-line navigation arrow at the right edge of the row. Use an existing icon library if available; otherwise use a small CSS mask or text glyph consistent with the current trainer icon treatment.
- Keep the row visually lightweight: no filled button background or pill container.
- Provide a subtle pressed state and a visible keyboard focus state.
- Give the link an accessible label that communicates that it opens map navigation.

## Growth Bubble Motion

- Continue floating every visible, unclaimed growth bubble until it is collected.
- Increase the vertical travel from the current 3-5px range to a 6-8px range so the motion is perceptible.
- Keep movement vertical only. Do not add horizontal drift, scale pulsing, or opacity pulsing.
- Stagger durations and delays across bubble anchors so they do not move in sync.
- Preserve the existing collection flight animation and top-right destination.
- Disable continuous floating when `prefers-reduced-motion: reduce` is active.

## Verification

- Extend the trainer visual contract to cover the `top: 40px` image position, exact supporting copy, full-row map link, navigation icon, focus treatment, and pressed feedback.
- Extend the growth-bubble visual contract to cover the 6-8px vertical range, staggered durations, and reduced-motion fallback.
- Run the complete test suite.
- Verify the trainer and home views at mobile viewport sizes, including store-link tap target, text fit, bubble motion, and console errors.
