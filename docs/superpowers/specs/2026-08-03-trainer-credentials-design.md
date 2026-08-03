# Trainer Credentials Design

## Goal

Add three coach credentials to the trainer Hero so users can scan the coach's qualifications before choosing an appointment time.

## Approved Content

The credentials use the reference copy exactly:

- Professional certification / NASM-CPT
- Fat loss and shaping / Specialized training
- Scientific guidance / Custom plan

The production interface uses the Chinese labels shown in the reference:

- 专业认证 / NASM-CPT
- 减脂塑形 / 专项训练
- 科学指导 / 定制计划

## Placement

Place the credentials in the open lower-left area of the Hero, directly below `减脂塑形教练 · 8年经验` and above the booking panel. The group must remain within the left-side area identified in the approved screenshot rather than spanning across the trainer's arm and dumbbell.

The existing store row, coach badge, name, and experience copy remain unchanged. The booking panel may move down only as much as needed to preserve clear spacing and prevent overlap.

## Visual Design

Use the approved C structure with a lighter execution:

- Three equal columns without a background container.
- A circular warm-gold line icon above each text group.
- Two short, low-opacity vertical dividers between columns.
- One-line primary labels and one-line secondary labels.
- Smaller icon and type sizing than the supplied wide reference so the group fits a 375 px mobile viewport.
- Existing Hero shading continues behind the group to preserve contrast; no new card, glow panel, or orange outline is added.

The orange rectangle in the approval screenshot indicates placement only and is not part of the final UI.

## Icons

Use simple outline symbols matching the three meanings: verified shield, training dumbbell, and guidance bars. Icons are decorative and hidden from assistive technology; the visible text carries the meaning.

## Responsive Behavior

At supported mobile widths, all three columns stay on one row. Labels must not wrap. The group may reduce internal gaps and icon size at the narrowest breakpoint, but it must not overlap the trainer artwork, identity copy, or booking panel.

## Accessibility

The credential group is informational and non-interactive. Use semantic list markup so screen readers announce the three credentials in order. Decorative icons and separators use `aria-hidden="true"`.

## Verification

- Add a contract test for the three approved text pairs and semantic group.
- Verify the group at 375 x 812 and 402 x 874.
- Confirm no text wrapping, overlap, clipping, horizontal overflow, or console errors.
- Confirm the booking panel remains fully usable and the existing Hero and navigation tests continue to pass.
