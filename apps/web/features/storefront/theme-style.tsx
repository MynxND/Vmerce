import type { StoreThemeDto } from '@cc/types';
import { themeToCssVariables } from '@cc/shared';

/**
 * Emits the creator's theme as inline custom properties on a wrapper element.
 *
 * Everything storefront-facing reads these variables, which is why a store can
 * be restyled without generating any new CSS.
 */
export function themeStyle(theme: StoreThemeDto): React.CSSProperties {
  return themeToCssVariables(theme) as React.CSSProperties;
}

/** Google Fonts link for whichever fonts the creator picked. */
export function ThemeFonts({ theme }: { theme: StoreThemeDto }) {
  const families = Array.from(
    new Set([theme.typography.headingFont, theme.typography.bodyFont].filter(Boolean)),
  );
  if (families.length === 0) return null;

  const query = families
    .map(
      (family) =>
        `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700;800`,
    )
    .join('&');

  return <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${query}&display=swap`} />;
}
