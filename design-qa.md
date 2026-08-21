# Store Editor and localization design QA

## Marquee section extension — 2026-08-20

- Source visual: `C:\Users\nikza\AppData\Local\Temp\codex-clipboard-72a55baa-b7bf-4588-9916-25448616e005.png`.
- Browser-rendered implementation: `.qa-marquee-storefront.png`.
- Side-by-side comparison: `.qa-marquee-compare.png`.
- The implemented section matches the source's narrow black ticker, uppercase widely tracked text, muted blue-grey labels, and vivid purple triple-slash accents.
- Continuous linear motion loops in either direction, pauses on hover, and respects reduced-motion preferences.
- Editor controls verified: pipe-separated items, separator, loop duration, direction, background colour, text colour, and accent colour.
- Added through the section library, rendered in live preview, published successfully, and verified on the public storefront.
- Neon migration `20260820235000_add_marquee_section` applied successfully.
- Browser console showed no visible runtime errors during the add/publish/public-store flow.
- Web/API TypeScript and ESLint checks passed.

final result: passed

## Evidence

- Source visual: `C:\Users\nikza\AppData\Local\Temp\codex-clipboard-3bda06ea-7b9f-47a1-b939-639d76b3d759.png`.
- Browser-rendered editor: `.qa-store-editor-final.png`.
- Thai dashboard localization: `.qa-dashboard-th.png`.
- Japanese editor localization: `.qa-store-editor-ja.png`.
- Combined reference/implementation comparison: `.qa-store-editor-compare.png`.
- Browser viewport: 1280 x 720 CSS px at density 1; source image: 1488 x 1058 px.
- State: authenticated Neko Studio owner, desktop preview, Hero selected.

## Visual comparison

The editor matches the reference's defining composition: narrow tool rail, searchable section library, central live storefront, top action bar, inline hero styling control, and reorderable page outline. The implementation uses the same light editor chrome and a black/cyan/purple cyber storefront. The generated hero artwork is a real raster asset sized and cropped for the preview rather than a placeholder.

The browser viewport is shorter than the source, so less storefront content is visible below the hero. All persistent controls remain visible without horizontal overflow, and each editor column scrolls independently.

## Typography and localization

- English uses Manrope for a cleaner product-interface rhythm.
- Thai uses Noto Sans Thai to avoid mismatched fallback glyphs and improve mark positioning.
- Japanese uses Noto Sans JP for consistent kanji, kana, and Latin metrics.
- Dashboard headings, descriptions, actions, date ranges, statistics, chart labels, top-product metadata, recent-order labels, table headers, statuses, sidebar navigation, and editor controls respond to the EN/TH/JA selector.
- Product titles and customer names remain unchanged because they are merchant-entered content, not interface copy.
- Locale selection persists in local storage and updates the document language.

## Interaction checks

- Switched Dashboard and Store Editor between English, Thai, and Japanese.
- Verified main Dashboard content changes with the surrounding navigation.
- Selected sections from both the preview and Page outline.
- Verified desktop/mobile preview controls, undo/redo, preview, and publish actions remain available.
- Browser console: no errors in the verified Dashboard and Store Editor states.
- TypeScript typecheck: passed.
- ESLint: passed.

## Comparison history

- Initial P1: the language selector translated only surrounding navigation while Dashboard content remained English.
- Initial P2: one Latin-oriented font stack produced weak Thai/Japanese typography.
- Fix: moved Dashboard analytics copy and shared status labels into the locale dictionary, then introduced language-aware Manrope, Noto Sans Thai, and Noto Sans JP stacks.
- Post-fix evidence: `.qa-dashboard-th.png` and `.qa-store-editor-ja.png` show localized content and corrected typography.

final result: passed
