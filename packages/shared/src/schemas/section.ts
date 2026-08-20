import { z } from 'zod';
import { SectionType } from '@cc/types';

/**
 * Per-section-type settings validation.
 *
 * The database stores section settings as free-form JSON, but the API must not
 * accept arbitrary shapes — a malformed `limit` would break the storefront
 * renderer. Each type gets a schema whose defaults match `SECTION_LIBRARY`, so
 * a freshly added section always validates.
 */

/** Links may be relative (`/collections/all`) or absolute, so no `.url()` here. */
const linkTarget = z.string().trim().max(2048);
const optionalImage = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((value) => value ?? null);
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(5000);

const navLinkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  url: linkTarget,
});

const galleryImageSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().max(160).default(''),
  linkUrl: linkTarget.optional(),
});

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  url: linkTarget,
});

const alignment = z.enum(['left', 'center', 'right']);
const columns = z.coerce.number().int().min(1).max(6);

export const sectionSettingsSchemas = {
  [SectionType.HEADER]: z.object({
    showSearch: z.boolean().default(false),
    showCart: z.boolean().default(true),
    sticky: z.boolean().default(true),
    links: z.array(navLinkSchema).max(10).default([]),
  }),

  [SectionType.HERO]: z.object({
    title: shortText.default('Welcome to my shop'),
    subtitle: shortText.default(''),
    buttonText: shortText.default('Shop Now'),
    buttonUrl: linkTarget.default('/products'),
    alignment: alignment.default('center'),
    imageUrl: optionalImage,
  }),

  [SectionType.FEATURED_PRODUCTS]: z.object({
    title: shortText.default('Featured'),
    collectionSlug: z
      .string()
      .trim()
      .max(120)
      .nullish()
      .transform((value) => value ?? null),
    limit: z.coerce.number().int().min(1).max(24).default(4),
    columns: columns.default(4),
  }),

  [SectionType.PRODUCT_GRID]: z.object({
    title: shortText.default('All products'),
    limit: z.coerce.number().int().min(1).max(48).default(12),
    columns: columns.default(3),
  }),

  [SectionType.COLLECTION_LIST]: z.object({
    title: shortText.default('Shop by collection'),
    columns: columns.default(3),
  }),

  [SectionType.IMAGE_BANNER]: z.object({
    imageUrl: optionalImage,
    title: shortText.default(''),
    subtitle: shortText.default(''),
    linkUrl: linkTarget.nullish().transform((value) => value ?? null),
    height: z.enum(['small', 'medium', 'large']).default('medium'),
  }),

  [SectionType.TEXT_BLOCK]: z.object({
    title: shortText.default(''),
    body: longText.default(''),
    alignment: alignment.default('left'),
  }),

  [SectionType.IMAGE_WITH_TEXT]: z.object({
    imageUrl: optionalImage,
    title: shortText.default(''),
    body: longText.default(''),
    imagePosition: z.enum(['left', 'right']).default('left'),
    buttonText: shortText.default(''),
    buttonUrl: linkTarget.default(''),
  }),

  [SectionType.GALLERY]: z.object({
    title: shortText.default('Gallery'),
    images: z.array(galleryImageSchema).max(24).default([]),
    columns: columns.default(3),
  }),

  [SectionType.VIDEO]: z.object({
    title: shortText.default(''),
    url: z.string().trim().max(2048).default(''),
    autoplay: z.boolean().default(false),
  }),

  [SectionType.SOCIAL_LINKS]: z.object({
    title: shortText.default('Follow me'),
    links: z.array(socialLinkSchema).max(12).default([]),
  }),

  [SectionType.NEWSLETTER]: z.object({
    title: shortText.default('Never miss a drop'),
    subtitle: shortText.default(''),
    buttonText: shortText.default('Subscribe'),
  }),

  [SectionType.FOOTER]: z.object({
    showSocials: z.boolean().default(true),
    text: longText.default(''),
    links: z.array(navLinkSchema).max(12).default([]),
  }),
} as const satisfies Record<SectionType, z.ZodTypeAny>;

export type SectionSettingsFor<T extends SectionType> = z.infer<(typeof sectionSettingsSchemas)[T]>;

/** Validates and fills in defaults for one section's settings. */
export function parseSectionSettings(
  type: SectionType,
  settings: unknown,
): Record<string, unknown> {
  const schema = sectionSettingsSchemas[type];
  return schema.parse(settings ?? {}) as Record<string, unknown>;
}

const sectionInputSchema = z.object({
  /** Present for an existing section; omitted when adding a new one. */
  id: z.string().min(1).optional(),
  type: z.nativeEnum(SectionType),
  visible: z.boolean().default(true),
  settings: z.unknown().default({}),
});

export type StoreSectionInput = z.infer<typeof sectionInputSchema>;

/**
 * Full replacement of a page's section stack. Order in the array *is* the render
 * order, so the client sends the list exactly as the creator arranged it.
 */
export const updatePageSectionsSchema = z.object({
  sections: z
    .array(sectionInputSchema)
    .min(1, 'A page needs at least one section')
    .max(40, 'That is too many sections for one page')
    .superRefine((sections, ctx) => {
      // Header and footer are fixed chrome: at most one of each, and they must
      // stay at the ends so the storefront layout stays coherent.
      const headers = sections.filter((section) => section.type === SectionType.HEADER);
      const footers = sections.filter((section) => section.type === SectionType.FOOTER);

      if (headers.length > 1 || footers.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Only one header and one footer per page',
        });
      }
      if (headers.length === 1 && sections[0]?.type !== SectionType.HEADER) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The header must stay first' });
      }
      if (footers.length === 1 && sections[sections.length - 1]?.type !== SectionType.FOOTER) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The footer must stay last' });
      }
    }),
});

export type UpdatePageSectionsInput = z.infer<typeof updatePageSectionsSchema>;
