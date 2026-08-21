import type {
  StoreThemeDto,
  ThemeColors,
  ThemeEffects,
  ThemeLayout,
  ThemeTypography,
} from '@cc/types';
import { ThemePreset } from '@cc/types';

export interface ThemePresetDefinition {
  preset: ThemePreset;
  label: string;
  description: string;
  colorMode: 'LIGHT' | 'DARK';
  buttonStyle: 'ROUNDED' | 'SQUARE' | 'PILL';
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  effects: ThemeEffects;
}

const baseTypography: ThemeTypography = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  fontScale: 1,
};

const baseLayout: ThemeLayout = {
  contentWidth: 1200,
  productColumns: 3,
  spacing: 1,
};

function definition(
  preset: ThemePreset,
  label: string,
  description: string,
  colorMode: 'LIGHT' | 'DARK',
  buttonStyle: 'ROUNDED' | 'SQUARE' | 'PILL',
  colors: ThemeColors,
  overrides: Partial<Pick<ThemePresetDefinition, 'typography' | 'layout' | 'effects'>> = {},
): ThemePresetDefinition {
  return {
    preset,
    label,
    description,
    colorMode,
    buttonStyle,
    colors,
    typography: { ...baseTypography, ...overrides.typography },
    layout: { ...baseLayout, ...overrides.layout },
    effects: { radius: 12, shadow: 'soft', animations: true, ...overrides.effects },
  };
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  definition(
    ThemePreset.MINIMAL,
    'Minimal',
    'Lots of white space, quiet type, product photography does the talking.',
    'LIGHT',
    'SQUARE',
    {
      primary: '#111111',
      secondary: '#4b5563',
      background: '#ffffff',
      surface: '#f7f7f8',
      text: '#111111',
      mutedText: '#6b7280',
      accent: '#111111',
      border: '#e5e7eb',
    },
    {
      effects: { radius: 2, shadow: 'none', animations: false },
      layout: { ...baseLayout, productColumns: 4 },
    },
  ),
  definition(
    ThemePreset.CUTE,
    'Cute',
    'Soft pinks, rounded everything, friendly and approachable.',
    'LIGHT',
    'PILL',
    {
      primary: '#ff5c8a',
      secondary: '#ffb3c7',
      background: '#fff7fa',
      surface: '#ffffff',
      text: '#3d2430',
      mutedText: '#9c7a88',
      accent: '#ffd166',
      border: '#ffe0ea',
    },
    { effects: { radius: 24, shadow: 'soft', animations: true } },
  ),
  definition(
    ThemePreset.DARK,
    'Dark',
    'High-contrast dark canvas that makes artwork glow.',
    'DARK',
    'ROUNDED',
    {
      primary: '#ffffff',
      secondary: '#a1a1aa',
      background: '#0b0b0f',
      surface: '#15151c',
      text: '#f4f4f5',
      mutedText: '#8b8b96',
      accent: '#7c5cff',
      border: '#26262f',
    },
  ),
  definition(
    ThemePreset.GAMING,
    'Gaming',
    'Punchy accents and tight spacing for stream-adjacent drops.',
    'DARK',
    'SQUARE',
    {
      primary: '#00e5a0',
      secondary: '#3b82f6',
      background: '#0a0f14',
      surface: '#111a22',
      text: '#e8f4f8',
      mutedText: '#7c95a5',
      accent: '#ff3d71',
      border: '#1d2b36',
    },
    { effects: { radius: 4, shadow: 'strong', animations: true } },
  ),
  definition(
    ThemePreset.PASTEL,
    'Pastel',
    'Muted candy palette, airy layout, low visual noise.',
    'LIGHT',
    'PILL',
    {
      primary: '#7c83fd',
      secondary: '#96f7d2',
      background: '#fbfaff',
      surface: '#ffffff',
      text: '#3b3663',
      mutedText: '#8d88ab',
      accent: '#ffc8dd',
      border: '#eae7f8',
    },
    { effects: { radius: 20, shadow: 'soft', animations: true } },
  ),
  definition(
    ThemePreset.EDITORIAL,
    'Editorial',
    'Magazine typography for zines, books and print runs.',
    'LIGHT',
    'SQUARE',
    {
      primary: '#1b1b1b',
      secondary: '#7a6a58',
      background: '#faf7f2',
      surface: '#ffffff',
      text: '#1b1b1b',
      mutedText: '#7a6a58',
      accent: '#b4462f',
      border: '#e4ded3',
    },
    {
      typography: { headingFont: 'Playfair Display', bodyFont: 'Inter', fontScale: 1.05 },
      effects: { radius: 0, shadow: 'none', animations: false },
      layout: { ...baseLayout, contentWidth: 1080, productColumns: 2 },
    },
  ),
  definition(
    ThemePreset.CYBER,
    'Cyber',
    'Neon-on-graphite. Built for limited drops and hype moments.',
    'DARK',
    'SQUARE',
    {
      primary: '#00f0ff',
      secondary: '#ff00e5',
      background: '#07070d',
      surface: '#101019',
      text: '#e6f7ff',
      mutedText: '#7d8798',
      accent: '#ffe600',
      border: '#1c1c2b',
    },
    { effects: { radius: 2, shadow: 'strong', animations: true } },
  ),
  definition(
    ThemePreset.ARTIST_PORTFOLIO,
    'Artist Portfolio',
    'Gallery-first layout with oversized imagery.',
    'LIGHT',
    'SQUARE',
    {
      primary: '#232323',
      secondary: '#6b6b6b',
      background: '#f4f4f2',
      surface: '#ffffff',
      text: '#191919',
      mutedText: '#767676',
      accent: '#d95f2b',
      border: '#e2e2de',
    },
    { layout: { ...baseLayout, productColumns: 2, contentWidth: 1320 } },
  ),
  definition(
    ThemePreset.VTUBER,
    'VTuber',
    'Bright idol-stage colours with playful rounding.',
    'LIGHT',
    'PILL',
    {
      primary: '#6c4cff',
      secondary: '#00d5ff',
      background: '#f6f4ff',
      surface: '#ffffff',
      text: '#241b45',
      mutedText: '#7f77a3',
      accent: '#ff5cae',
      border: '#e7e2ff',
    },
    { effects: { radius: 18, shadow: 'medium', animations: true } },
  ),
  definition(
    ThemePreset.CLEAN_COMMERCE,
    'Clean Commerce',
    'Neutral, trustworthy, conversion-focused default.',
    'LIGHT',
    'ROUNDED',
    {
      primary: '#2563eb',
      secondary: '#0f172a',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      mutedText: '#64748b',
      accent: '#2563eb',
      border: '#e2e8f0',
    },
  ),
];

// Merch-first shops should open with a strong, campaign-ready canvas. Creators
// can still switch to any quieter preset during onboarding or in the editor.
export const DEFAULT_THEME_PRESET = ThemePreset.CYBER;

export function getThemePreset(preset: ThemePreset): ThemePresetDefinition {
  return (
    THEME_PRESETS.find((entry) => entry.preset === preset) ??
    THEME_PRESETS[THEME_PRESETS.length - 1]!
  );
}

const SHADOW_VALUES: Record<ThemeEffects['shadow'], string> = {
  none: 'none',
  soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06)',
  medium: '0 2px 4px rgb(0 0 0 / 0.06), 0 12px 32px rgb(0 0 0 / 0.10)',
  strong: '0 4px 8px rgb(0 0 0 / 0.10), 0 20px 48px rgb(0 0 0 / 0.18)',
};

const BUTTON_RADIUS: Record<StoreThemeDto['buttonStyle'], string> = {
  SQUARE: '2px',
  ROUNDED: '10px',
  PILL: '999px',
};

/**
 * Flattens a store theme into CSS custom properties.
 *
 * The storefront is styled entirely through these variables so that no
 * per-store Tailwind classes ever need to be generated at runtime.
 */
export function themeToCssVariables(theme: {
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  effects: ThemeEffects;
  buttonStyle: StoreThemeDto['buttonStyle'];
}): Record<string, string> {
  return {
    '--store-primary': theme.colors.primary,
    '--store-secondary': theme.colors.secondary,
    '--store-background': theme.colors.background,
    '--store-surface': theme.colors.surface,
    '--store-text': theme.colors.text,
    '--store-muted': theme.colors.mutedText,
    '--store-accent': theme.colors.accent,
    '--store-border': theme.colors.border,
    '--store-heading-font': theme.typography.headingFont,
    '--store-body-font': theme.typography.bodyFont,
    '--store-font-scale': String(theme.typography.fontScale),
    '--store-content-width': `${theme.layout.contentWidth}px`,
    '--store-columns': String(theme.layout.productColumns),
    '--store-spacing': String(theme.layout.spacing),
    '--store-radius': `${theme.effects.radius}px`,
    '--store-shadow': SHADOW_VALUES[theme.effects.shadow],
    '--store-button-radius': BUTTON_RADIUS[theme.buttonStyle],
  };
}
