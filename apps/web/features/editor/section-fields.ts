import { SectionType } from '@cc/types';

/**
 * Declarative description of each section's editable settings.
 *
 * The settings panel is generated from this table rather than hand-written per
 * type, so adding a field to a section is a one-line change here. Keys and
 * bounds mirror `sectionSettingsSchemas` in `@cc/shared`, which is what the API
 * validates against.
 */
export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'image'
  | 'collection'
  | 'links'
  | 'images'
  | 'socials';

export interface SectionField {
  key: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' },
];

const COLUMNS: SectionField = { key: 'columns', label: 'Columns', kind: 'number', min: 1, max: 6 };
const TITLE: SectionField = { key: 'title', label: 'Heading', kind: 'text' };

export const SECTION_FIELDS: Record<SectionType, SectionField[]> = {
  [SectionType.HEADER]: [
    { key: 'sticky', label: 'Stick to the top when scrolling', kind: 'boolean' },
    { key: 'showCart', label: 'Show the cart button', kind: 'boolean' },
    { key: 'showSearch', label: 'Show search', kind: 'boolean' },
    { key: 'links', label: 'Extra navigation links', kind: 'links' },
  ],

  [SectionType.HERO]: [
    TITLE,
    { key: 'subtitle', label: 'Subheading', kind: 'text' },
    { key: 'buttonText', label: 'Button label', kind: 'text', placeholder: 'Shop now' },
    {
      key: 'buttonUrl',
      label: 'Button link',
      kind: 'text',
      placeholder: '/products',
      hint: 'A path on your shop, or a full URL.',
    },
    { key: 'alignment', label: 'Text alignment', kind: 'select', options: ALIGNMENT_OPTIONS },
    { key: 'imageUrl', label: 'Background image', kind: 'image' },
  ],

  [SectionType.FEATURED_PRODUCTS]: [
    TITLE,
    {
      key: 'collectionSlug',
      label: 'Collection',
      kind: 'collection',
      hint: 'Leave empty to show your newest products.',
    },
    { key: 'limit', label: 'How many products', kind: 'number', min: 1, max: 24 },
    COLUMNS,
  ],

  [SectionType.PRODUCT_GRID]: [
    TITLE,
    { key: 'limit', label: 'How many products', kind: 'number', min: 1, max: 48 },
    COLUMNS,
  ],

  [SectionType.COLLECTION_LIST]: [TITLE, COLUMNS],

  [SectionType.IMAGE_BANNER]: [
    { key: 'imageUrl', label: 'Image', kind: 'image' },
    TITLE,
    { key: 'subtitle', label: 'Subheading', kind: 'text' },
    { key: 'linkUrl', label: 'Link', kind: 'text', placeholder: '/collections/new-drop' },
    {
      key: 'height',
      label: 'Height',
      kind: 'select',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
  ],

  [SectionType.TEXT_BLOCK]: [
    TITLE,
    { key: 'body', label: 'Body text', kind: 'textarea' },
    { key: 'alignment', label: 'Alignment', kind: 'select', options: ALIGNMENT_OPTIONS },
  ],

  [SectionType.IMAGE_WITH_TEXT]: [
    { key: 'imageUrl', label: 'Image', kind: 'image' },
    TITLE,
    { key: 'body', label: 'Body text', kind: 'textarea' },
    {
      key: 'imagePosition',
      label: 'Image side',
      kind: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    { key: 'buttonText', label: 'Button label', kind: 'text' },
    { key: 'buttonUrl', label: 'Button link', kind: 'text' },
  ],

  [SectionType.GALLERY]: [TITLE, { key: 'images', label: 'Images', kind: 'images' }, COLUMNS],

  [SectionType.VIDEO]: [
    TITLE,
    {
      key: 'url',
      label: 'Video URL',
      kind: 'text',
      placeholder: 'https://youtube.com/watch?v=…',
      hint: 'YouTube or Twitch links work.',
    },
    { key: 'autoplay', label: 'Autoplay (muted)', kind: 'boolean' },
  ],

  [SectionType.SOCIAL_LINKS]: [TITLE, { key: 'links', label: 'Profiles', kind: 'socials' }],

  [SectionType.NEWSLETTER]: [
    TITLE,
    { key: 'subtitle', label: 'Subheading', kind: 'text' },
    { key: 'buttonText', label: 'Button label', kind: 'text' },
  ],

  [SectionType.FOOTER]: [
    { key: 'text', label: 'Footer text', kind: 'textarea' },
    { key: 'showSocials', label: 'Show social links', kind: 'boolean' },
    { key: 'links', label: 'Footer links', kind: 'links' },
  ],
};

export function fieldsFor(type: SectionType): SectionField[] {
  return SECTION_FIELDS[type] ?? [];
}
