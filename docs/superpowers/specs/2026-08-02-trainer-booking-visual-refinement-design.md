# Trainer Booking Visual Refinement

## Scope

Refine the existing private-trainer booking page without changing its booking model, navigation behavior, map, store list, or confirmation dialog content.

## Approved Changes

### Bottom navigation background

- In the trainer-booking view only, replace the brown Dock surface with the page background color `#0b0e14`.
- The dark page background must visually continue through the bottom safe region without a brown strip.
- Preserve the existing six-tab layout, active state, dimensions, and interaction.

### Trainer Hero composition

- Display the full transparent trainer asset without cropping the head, arms, or dumbbells.
- Align the trainer to the right and bottom of the Hero, matching the supplied reference composition.
- Keep the store and trainer identity copy on the left.
- Preserve the current 320px Hero height and dark background framework.

### Date controls

- Keep seven dates in one row.
- Change each date control into a compact vertical capsule.
- Unselected dates use the existing subdued dark-glass treatment.
- The selected capsule uses a solid yellow surface with dark text.
- The selected date number sits inside a lighter circular surface below the weekday.
- Preserve accessible pressed states and the existing seven-day booking behavior.

### Booking action hierarchy

- Keep `取消` as a transparent text button with only hover, pressed, and focus feedback.
- Keep `确认预约` as the sole filled primary action.
- Increase the space between the two actions from 6px to 14px.
- Preserve the 46px button height and 24px horizontal padding on the primary action.

### Map and store status

- Reduce the map image desaturation and darkening so street details remain legible.
- Replace the current circular map markers with the supplied `/Users/admin/Downloads/Frame.svg` pin silhouette.
- Reuse the SVG as a colorable mask: available locations use the yellow accent and the closed location uses a neutral gray.
- Keep location numbers centered in the circular head of each pin.
- Render the third store row's numbered badge in a neutral gray, not a dimmed yellow.
- Preserve all three map positions, store rows, and their non-navigating Demo behavior.

## Responsive And Verification Criteria

- Verify at 402×874 and 375×812.
- The complete trainer remains visible without horizontal overflow.
- Seven date capsules remain on one row without text clipping.
- The action summary, cancel, and confirmation controls do not overlap at 375px.
- The Dock background reaches both bottom corners with no brown remnant.
- The map remains readable without a heavy dark overlay, and all three SVG pin shapes are visible.
- The third map pin and third list number are both visibly gray.
- Existing booking tests and interaction states continue to pass.
