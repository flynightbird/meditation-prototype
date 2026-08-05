# Confirmed Booking State Design

## Goal

Make a confirmed trainer appointment immediately recognizable in the date and time selectors without confusing it with a temporary selection or an unavailable slot.

## State Model

The interface must visually distinguish three existing states:

1. **Temporary selection**: a date or time selected before confirmation. Keep the current selected styling and action bar behavior.
2. **Confirmed booking**: the date and time stored in `confirmedBooking`. Apply the persistent booking markers defined below.
3. **Unavailable time**: any time that cannot be selected but is not the user's confirmed booking. Keep the current subdued disabled styling.

The confirmed-booking style takes precedence over the generic disabled style.

## Confirmed Date

- When the confirmed date is also the date currently being viewed, keep the existing full yellow date capsule.
- When the user views another date, return the confirmed date capsule to its normal dark surface and fill only its existing `28px` date-number circle with honey yellow.
- Use dark text inside the yellow number circle. Do not add another dot, label, or checkmark to the date.
- Expose the confirmed state through a dedicated data attribute so it is independent from `aria-pressed`, which continues to represent the date currently being viewed.

## Confirmed Time

- When the confirmed date is being viewed, render the booked time as a full honey-yellow cell with dark text.
- Place a small `14px` circular check badge at the upper-right inside the cell. It is a confirmation mark, not a square checkbox.
- Keep the time unavailable for interaction, but do not apply the generic grey disabled appearance.
- Preserve the current cell dimensions and grid tracks so the badge cannot shift the layout.
- Update the accessible label to identify the slot as the user's confirmed appointment rather than merely unavailable.

## Interaction

- Confirmation continues to clear the temporary time selection and show the existing booking status message.
- Switching dates does not remove or alter the confirmed booking.
- Returning to the confirmed date restores the full-yellow confirmed time cell.
- The confirmed time cannot be selected or confirmed again.
- No new click behavior, cancellation flow, or multiple-booking support is introduced.

## Visual Priority

The hierarchy is:

1. Confirmed time: full yellow cell plus check.
2. Currently viewed date: full yellow capsule.
3. Confirmed date while not viewed: yellow date-number circle.
4. Temporary time selection: current translucent yellow treatment.
5. Generic unavailable time: current subdued grey treatment.

This keeps yellow meaningful: a large yellow surface represents the user's active or confirmed context, while the small yellow date circle acts as a persistent locator when browsing elsewhere.

## Verification

- Confirming a booking marks the correct date and time without changing layout dimensions.
- The booked time remains visibly confirmed instead of inheriting the generic disabled style.
- Viewing another date leaves a yellow number circle on the confirmed date.
- Returning to the confirmed date shows the full-yellow time cell and check badge again.
- Temporary selection and generic unavailable states remain visually distinct.
- Screen-reader labels identify selected, confirmed, and unavailable states correctly.
