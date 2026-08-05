# Bilingual Localization Design

**Date:** 2026-08-06

## Goal

Add complete Simplified Chinese and English localization to the existing mobile prototype without adding a visible language switcher or changing the approved layouts and interaction flow.

## Scope

Localization covers every user-facing and assistive string in the shipped application:

- home greeting, growth identity, growth stats, task cards, and bottom navigation;
- meditation recommendation, countdown, controls, completion, reward, meal preparation, and meal-time states;
- trainer profile, date and time selection, store map and list, booking tray, confirmation dialog, confirmed state, cancellation state, and toast messages;
- document title, image alternative text, accessible names, live-region text, status text, and dynamic labels.

The desktop portfolio/showcase is outside this feature and remains excluded from the published application.

## Supported Locales

- `zh-CN`: default fallback and the current Chinese experience.
- `en`: English experience.

Locale resolution uses this strict priority:

1. A supported `lang` URL parameter (`?lang=en` or `?lang=zh-CN`).
2. The first supported locale in `navigator.languages`, falling back to `navigator.language`.
3. `zh-CN` when the requested or system locale is unsupported.

Language selection is not persisted because the product has no manual language control. The URL override exists only for demos, QA, and shareable language-specific links.

The application must update the root `<html lang>` attribute to the resolved locale.

## Architecture

Create `src/i18n.js` as the single localization boundary. It owns:

- the `zh-CN` and `en` dictionaries;
- locale normalization and resolution;
- `t(key, params)` lookup with named interpolation;
- locale-aware date formatting helpers;
- static DOM translation for text content and supported attributes.

The translation function falls back from a missing English key to the matching Chinese key. In development it also warns about the missing key. It must never render a raw translation key to users.

Static markup uses declarative attributes such as `data-i18n`, `data-i18n-aria-label`, and `data-i18n-alt`. Dynamic render paths in `src/app.js`, `src/experience.js`, `src/growth-stats.js`, `src/trainer-booking.js`, and `src/trainer-booking-view.js` use translation keys and interpolation rather than embedding duplicate display strings.

Domain state continues to store stable identifiers, numbers, dates, and times. It must not persist localized display text.

## Content Rules

### Chinese

The Chinese interface keeps the current copy and proper names unchanged, including:

- `李教练`
- `中田健身 · 南山旗舰店`
- trainer price `¥298`

### English

The English interface uses concise, natural product copy rather than literal word-for-word translation.

Required proper names and price:

- trainer: `Coach Yang`
- fixed store: `Fun Fitness · Victoria Flagship`
- trainer price: `$50`

Other store names, addresses, course descriptions, growth attributes, tasks, meditation guidance, and booking states receive natural English equivalents. Existing business quantities remain unchanged unless explicitly localized above.

Time values remain in the current 24-hour format so the booking model and demo sequence do not change. Dates use locale-aware formatting; an English example is `Tue, Aug 11`.

## Layout And Interaction

- No visible language selector is added.
- Navigation, cards, buttons, dialogs, media, transitions, and state behavior remain unchanged.
- English copy should be edited for compactness before any layout expansion.
- Headings may wrap naturally where existing responsive rules permit it.
- Text must not overflow, cover the pony, obscure controls, or resize fixed-format task and navigation components.
- Existing font families and weights remain unchanged.

## Accessibility

- Visible text and its accessible name must resolve from the same locale.
- `aria-label`, image `alt`, dialog labels, timer labels, control labels, and status announcements are localized.
- Locale changes made by the URL parameter take effect before the primary interface is presented, preventing mixed-language first paint where practical.
- Existing live-region behavior and focus management remain unchanged.

## Error Handling

- Unsupported locale parameters fall back to `zh-CN`.
- Missing English keys fall back to their Chinese value and emit a development warning.
- Missing keys in both dictionaries return a safe empty string and emit a development warning; raw key paths are never displayed.
- Invalid or missing interpolation values must not throw or block rendering.

## Verification

Automated tests cover:

- URL, browser-language, and fallback resolution priority;
- locale normalization for Chinese and English variants;
- interpolation and missing-key fallback;
- Chinese and English date formatting;
- one-to-one dictionary key coverage;
- absence of migrated user-facing hard-coded Chinese strings in dynamic render paths;
- correct localized proper names and locale-specific trainer prices.

Browser verification covers both `?lang=zh-CN` and `?lang=en` across:

- home and task rail;
- active meditation countdown and controls;
- completion, reward, and meal preparation states;
- trainer booking, confirmation, confirmed, and cancellation states.

Both languages are checked at `375x667`, `375x812`, and `402x874`. Verification must confirm no overflow or overlap, correct dates and prices, consistent accessible names, no console errors, and no untranslated or mixed-language strings.

## Non-Goals

- A visible language picker or settings page.
- Persisting a language preference.
- Runtime translation downloads or a translation management service.
- Additional locales beyond Simplified Chinese and English.
- Translating or republishing the excluded desktop portfolio/showcase.
