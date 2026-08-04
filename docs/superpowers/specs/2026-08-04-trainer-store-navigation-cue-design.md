# Trainer Store Navigation Cue Design

## Goal

Make the trainer Hero store entry read clearly as a navigation action while preserving a useful distance cue and keeping the header visually restrained.

## Approved Layout

Keep the existing store entry on one line in this order:

1. Existing yellow location dot
2. `中田健身 · 南山旗舰店`
3. `1.2km`
4. Paper-plane-style navigation icon

The distance sits directly after the store name and before the navigation icon. Do not add a divider, chip, button background, or separate container.

## Visual Treatment

- Replace the current `↗` glyph with a familiar paper-plane/navigation symbol.
- Keep the navigation icon in the existing warm yellow family so it remains the action cue.
- Render `1.2km` smaller and less prominent than the store name.
- Preserve the current 32px minimum touch-row height, spacing rhythm, and single-line presentation.
- Prevent the store name, distance, and icon from wrapping independently on supported mobile widths.

## Interaction And Accessibility

- The entire store row remains one link.
- Preserve the existing Amap URL, new-tab behavior, accessible label, focus-visible outline, and active feedback.
- The navigation icon is decorative and remains hidden from assistive technology.
- The distance is visible text and does not need a separate accessible label.

## Data Scope

Use the static prototype value `1.2km`. Do not request geolocation, calculate live distance, or introduce loading and permission states.

## Verification

- Contract-test the store name, `1.2km`, and decorative navigation icon in the same link.
- Confirm the old `↗` glyph is removed.
- Confirm the complete row remains linked to Amap with its existing accessible label.
- Check the row at the project mobile widths for one-line fit and horizontal overflow.

## Out Of Scope

- Dynamic location or distance calculation
- Changes to nearby-store distances
- Changes to the trainer Hero position, identity, credentials, or map destination
- New background containers, dividers, or navigation copy
