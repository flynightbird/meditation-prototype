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

### Approved Polish Refinements

- Replace each flat gold icon border with an attached gradient ring: brightest on the upper-left arc and gradually dimmer toward the lower-right.
- Keep the ring restrained and warm gold. It must not read as a glowing button.
- Move the booking and nearby-store content group down by about 20 px, increasing the credential-to-booking gap from about 8 px to about 28 px. Keep the credential group and coach identity fixed.
- Add one elongated, slightly diagonal cool blue-gray light band behind the trainer, running from behind the head toward the shoulder and back.
- The light band uses low saturation, a soft edge, and about 10% to 12% peak opacity. It must remain behind the trainer, avoid the left-side copy, and use no animation.
- Do not use a circular glow, neon edge, decorative orb, or pronounced bloom.

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
- Confirm the credential-to-booking gap is approximately 28 px after the content group moves down.
- Confirm the cool light band remains behind the trainer and does not reduce copy or portrait clarity.
- Confirm the booking panel remains fully usable and the existing Hero and navigation tests continue to pass.
