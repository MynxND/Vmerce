import { z } from 'zod';
import { CreatorType, StoreStatus, ThemePreset } from '@cc/types';
import { handleSchema, hexColorSchema, nullableUrlSchema } from './common';

export const createStoreSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(60),
  handle: handleSchema,
  description: z.string().trim().max(500).nullish(),
  creatorType: z.nativeEnum(CreatorType).default(CreatorType.OTHER),
  logoUrl: nullableUrlSchema,
  avatarUrl: nullableUrlSchema,
  currency: z.string().trim().toUpperCase().length(3).default('THB'),
  country: z.string().trim().length(2).toUpperCase().default('TH'),
  themePreset: z.nativeEnum(ThemePreset).optional(),
});
export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const updateStoreSchema = createStoreSchema
  .omit({ themePreset: true })
  .partial()
  .extend({
    bannerUrl: nullableUrlSchema,
    status: z.nativeEnum(StoreStatus).optional(),
    socialLinks: z.record(z.string().trim().max(200)).optional(),
  });
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

export const checkHandleSchema = z.object({ handle: handleSchema });

/** Onboarding wizard payload — creates the store and its theme in one call. */
export const onboardingSchema = z.object({
  creatorType: z.nativeEnum(CreatorType),
  name: z.string().trim().min(2).max(60),
  handle: handleSchema,
  description: z.string().trim().max(500).nullish(),
  logoUrl: nullableUrlSchema,
  avatarUrl: nullableUrlSchema,
  themePreset: z.nativeEnum(ThemePreset),
  currency: z.string().trim().toUpperCase().length(3).default('THB'),
  country: z.string().trim().length(2).toUpperCase().default('TH'),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const themeColorsSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  background: hexColorSchema,
  surface: hexColorSchema,
  text: hexColorSchema,
  mutedText: hexColorSchema,
  accent: hexColorSchema,
  border: hexColorSchema,
});

export const themeTypographySchema = z.object({
  headingFont: z.string().trim().min(1).max(60),
  bodyFont: z.string().trim().min(1).max(60),
  fontScale: z.number().min(0.8).max(1.4),
});

export const themeLayoutSchema = z.object({
  contentWidth: z.number().int().min(720).max(1600),
  productColumns: z.number().int().min(1).max(6),
  spacing: z.number().min(0.5).max(2),
});

export const themeEffectsSchema = z.object({
  radius: z.number().int().min(0).max(40),
  shadow: z.enum(['none', 'soft', 'medium', 'strong']),
  animations: z.boolean(),
});

export const updateThemeSchema = z
  .object({
    preset: z.nativeEnum(ThemePreset),
    colors: themeColorsSchema,
    typography: themeTypographySchema,
    layout: themeLayoutSchema,
    effects: themeEffectsSchema,
    buttonStyle: z.enum(['ROUNDED', 'SQUARE', 'PILL']),
    colorMode: z.enum(['LIGHT', 'DARK']),
    faviconUrl: nullableUrlSchema,
  })
  .partial();
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
