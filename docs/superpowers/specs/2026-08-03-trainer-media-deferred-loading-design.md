# Trainer Media Deferred Loading Design

## Context

The deployed home screen meets its video budget, but the hidden trainer booking page still contains eager `src` attributes for `trainer-hero.png` and `trainer-map.png`. Chromium downloads both images during the home-screen cold load even though `#trainerPage` is hidden. The two images add about 3.62 MB and raise the measured production cold transfer from the intended 2.3 MB ceiling to 5.13 MB.

## Goal

Keep the production home-screen cold transfer at or below 2.3 MB by loading the trainer hero and map only when the user opens the trainer booking page. Preserve the current trainer visuals, layout, booking state, and navigation behavior.

## Design

### Markup

Replace the eager `src` attributes on the trainer hero and trainer map images with `data-deferred-src`. Keep the existing image elements, classes, alt text, and asset URLs unchanged. The small trainer dialog avatar remains eager because it is approximately 1.3 KB and does not materially affect the budget.

### Runtime

`mountTrainerBooking` will collect the trainer images marked with `data-deferred-src`. An idempotent helper will copy each deferred URL into `src` once. `show()` will call this helper immediately before revealing the trainer page.

The helper will not await image decoding or block navigation. A failed image request leaves the existing alt text and surrounding trainer UI usable. Reopening the trainer page will not replace sources or trigger additional loads.

### Loading Sequence

1. The home screen loads without requests for `trainer-hero.png` or `trainer-map.png`.
2. The user selects the trainer navigation item.
3. `show()` assigns both trainer image sources and reveals the existing trainer page.
4. Browser caching handles all later trainer-page visits without duplicate downloads.

## Testing

Add contract coverage that requires exactly two trainer images to use `data-deferred-src`, rejects eager `src` attributes for those URLs, and verifies that the trainer view loads deferred sources from `show()` through an idempotent helper.

Run the complete Node test suite and JavaScript syntax checks. After deployment, record a fresh cold-load HAR and verify:

- total transfer is at most 2.3 MB;
- the only initial media request is `video-meditation.mp4`;
- neither trainer large image is requested on the home screen;
- opening the trainer page requests both trainer images;
- the page remains free of viewport overflow at 375 x 812;
- production LCP is reported separately and is not misrepresented if network variance keeps it above 2.5 seconds.

## Scope Boundaries

This change does not re-encode trainer assets, add placeholders, preload trainer media while the home screen is idle, restructure the trainer page, or alter booking interactions. Those changes would require separate visual and performance review.
