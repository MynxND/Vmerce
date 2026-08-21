export type StorefrontFontCategory = 'Display' | 'Sans' | 'Serif' | 'Mono' | 'Thai' | 'Japanese';

export interface StorefrontFontDefinition {
  family: string;
  category: StorefrontFontCategory;
  fallback: 'sans-serif' | 'serif' | 'monospace';
}

export const STOREFRONT_FONTS: StorefrontFontDefinition[] = [
  { family: 'Anton', category: 'Display', fallback: 'sans-serif' },
  { family: 'Bebas Neue', category: 'Display', fallback: 'sans-serif' },
  { family: 'Oswald', category: 'Display', fallback: 'sans-serif' },
  { family: 'Barlow Condensed', category: 'Display', fallback: 'sans-serif' },
  { family: 'Archivo Black', category: 'Display', fallback: 'sans-serif' },
  { family: 'Black Ops One', category: 'Display', fallback: 'sans-serif' },
  { family: 'Orbitron', category: 'Display', fallback: 'sans-serif' },
  { family: 'Press Start 2P', category: 'Display', fallback: 'sans-serif' },
  { family: 'Manrope', category: 'Sans', fallback: 'sans-serif' },
  { family: 'Inter', category: 'Sans', fallback: 'sans-serif' },
  { family: 'Poppins', category: 'Sans', fallback: 'sans-serif' },
  { family: 'Montserrat', category: 'Sans', fallback: 'sans-serif' },
  { family: 'Roboto', category: 'Sans', fallback: 'sans-serif' },
  { family: 'DM Sans', category: 'Sans', fallback: 'sans-serif' },
  { family: 'Space Grotesk', category: 'Sans', fallback: 'sans-serif' },
  { family: 'Playfair Display', category: 'Serif', fallback: 'serif' },
  { family: 'Cormorant Garamond', category: 'Serif', fallback: 'serif' },
  { family: 'Merriweather', category: 'Serif', fallback: 'serif' },
  { family: 'JetBrains Mono', category: 'Mono', fallback: 'monospace' },
  { family: 'IBM Plex Mono', category: 'Mono', fallback: 'monospace' },
  { family: 'Space Mono', category: 'Mono', fallback: 'monospace' },
  { family: 'Kanit', category: 'Thai', fallback: 'sans-serif' },
  { family: 'Prompt', category: 'Thai', fallback: 'sans-serif' },
  { family: 'Sarabun', category: 'Thai', fallback: 'sans-serif' },
  { family: 'IBM Plex Sans Thai', category: 'Thai', fallback: 'sans-serif' },
  { family: 'Noto Sans Thai', category: 'Thai', fallback: 'sans-serif' },
  { family: 'Noto Sans JP', category: 'Japanese', fallback: 'sans-serif' },
  { family: 'Zen Kaku Gothic New', category: 'Japanese', fallback: 'sans-serif' },
  { family: 'M PLUS 1p', category: 'Japanese', fallback: 'sans-serif' },
];

const legacyFonts: Record<string, string> = {
  display: 'Anton',
  sans: 'Manrope',
  serif: 'Playfair Display',
  mono: 'JetBrains Mono',
};

export function getStorefrontFont(value: unknown): StorefrontFontDefinition {
  const requested = typeof value === 'string' ? (legacyFonts[value] ?? value) : 'Anton';
  return STOREFRONT_FONTS.find((font) => font.family === requested) ?? STOREFRONT_FONTS[0]!;
}
