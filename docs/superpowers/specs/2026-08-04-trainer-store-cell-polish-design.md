# Trainer Store Cell Polish

## Goal

Improve the trainer page store cells so users can scan store priority, address, distance, hours, and service features without increasing cell height or adding visual clutter.

## Store Cell Structure

Each store remains an `82px` row with three columns:

1. A plain `01`, `02`, or `03` sequence marker.
2. A three-line information group.
3. A compact distance-and-chevron module centered vertically in the cell.

The information group contains:

- Row 1: optional `最近` tag, store name, and open/closed status.
- Row 2: address only.
- Row 3: business hours, a separator, and service features.

The distance module contains `756m ›`, `2.8km ›`, or `4.1km ›`. It sits in the right column and visually aligns with the address row because it is vertically centered in the full cell.

## Visual Treatment

### Sequence Markers

- Remove the circular border and background.
- Render two-digit markers with `font-variant-numeric: tabular-nums`.
- Use `10px`, regular weight, and `rgba(255, 250, 243, 0.3)` so the markers remain navigational rather than decorative.

### Nearest Store

- Only the first store receives a `最近` tag before its name.
- Use `8px` type, `#f8d553` text, `rgba(248, 213, 83, 0.1)` background, `rgba(248, 213, 83, 0.22)` border, and `5px` radius.
- Keep the existing open/closed status after the store name.

### Address And Distance

- Keep the address at `11px` and `rgba(255, 250, 243, 0.46)`.
- Style the distance module as an inline flex group with a `3px` gap, `10px` type, and the existing muted trainer text color.
- Use a restrained `16px` chevron rather than the current oversized `32px` character.

### Hours And Features

- Keep hours secondary at `9px`, regular weight, and `rgba(255, 250, 243, 0.34)`.
- Render service features at `9.5px`, `500` weight, and `rgba(255, 250, 243, 0.58)`.
- Do not add chip containers; typography alone creates the hierarchy.

## Related Trainer Refinements

- Set `未来 7 天` to `var(--trainer-text-muted)`, exactly matching the nearby-store summary color.
- Increase the credential icon-to-title gap from `5px` to `7px`.
- Keep credential circle size, credential text spacing, booking-card position, store row height, separators, map, and all interaction behavior unchanged.

## Verification

- Contract tests must lock the new store markup, sequence treatment, nearest tag, address/distance separation, hours/features hierarchy, booking helper color, and credential gap.
- At `375x812` and `402x874`, store titles and third-line details must remain on one line, distance modules must not overlap content, and the page must not overflow horizontally.
- The first store alone displays `最近`; the closed store retains its existing subdued treatment.
