# Navigation Icon Optical Size

## Goal

Make navigation items 2–6 visually match the unselected AI coach icon without shifting labels or changing the Dock layout.

## Approved Direction

- Keep the standard navigation icon slot at `22px × 22px`.
- Render both `on` and `off` SVGs for items 2–6 at `20px × 20px`, centered inside that slot.
- Keep the unselected AI coach robot, selected AI coach pony, label positions, `2px` icon-to-label gap, and `70px` Dock height unchanged.
- Apply one shared rule to all five standard navigation items; do not introduce per-icon sizes.

## Verification

- The visual contract must require a `22px` standard icon slot and centered `20px` standard state images.
- Confirm the first icon remains unchanged in both states.
- Check the navigation at mobile widths for stable label alignment, no clipping, and no horizontal overflow.
