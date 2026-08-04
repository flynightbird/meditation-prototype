# Bottom Navigation Single-State Icon Design

## Goal

Refine bottom navigation items two through six so they use one compact SVG asset per item and a consistent selected color. Preserve the existing six-tab dock, sliding selection capsule, labels, and the special selected AI coach pony.

## Approved Visual Behavior

- Replace the booking trainer icon with the supplied `/Users/admin/Desktop/约教练-off.svg` artwork.
- Render navigation items two through six at `22px` by `22px`.
- Use a neutral light color for unselected icons.
- Use exactly `#FFD32C` for the selected icon.
- Replace the first AI coach off state with the supplied `/Users/admin/Desktop/ai教练-on.png`, rendered at `22px` by `22px` despite the source filename.
- Keep the AI coach pony selected state, scale, and bounce animation unchanged.
- Do not change dock height, padding, capsule geometry, label typography, or navigation behavior.

## Asset Model

Keep only one source SVG for each standard navigation item:

- `nav-trainer-off.svg`
- `nav-skill-off.svg`
- `nav-plan-off.svg`
- `nav-points-off.svg`
- `nav-mine-off.svg`

Delete the five filled selected-state files:

- `nav-trainer-on.svg`
- `nav-skill-on.svg`
- `nav-plan-on.svg`
- `nav-points-on.svg`
- `nav-mine-on.svg`

Add `nav-ai-coach-off.png` for the AI coach unselected state. Retain `nav-ai-coach-on.svg` because the AI coach has a deliberately distinct selected-state illustration.

## Rendering Approach

Represent items two through six with a single empty inline element carrying the relevant asset URL through a CSS custom property. Use the SVG as both `mask-image` and `-webkit-mask-image`, with centered, contained, non-repeating mask settings.

Set the element background color to the unselected neutral color by default. Change only the background color to `#FFD32C` when the parent `.nav-item` is active. This provides an exact selected color without duplicating assets or relying on an approximate CSS filter.

The supplied trainer SVG may retain its original geometry and view box because mask rendering ignores its embedded gradient color while preserving its silhouette.

## Accessibility And Motion

- Keep icons decorative with the existing `aria-hidden` wrapper; visible labels continue to name each destination.
- Preserve `aria-current="page"` behavior.
- Do not add motion to items two through six.
- Preserve the existing reduced-motion handling for the AI coach pony.

## Verification

Update the visual contract tests first so they require:

- the supplied trainer icon contents at `assets/nav-trainer-off.svg`;
- no references to, and no files for, the five standard `-on.svg` assets;
- one mask-backed icon element for each of items two through six;
- exact active color `#FFD32C`;
- exact `22px` standard icon dimensions;
- exact supplied AI coach off asset at `22px`;
- unchanged AI coach selected asset and animation behavior.

Run the focused visual contract test, then the full test suite and `git diff --check`.
