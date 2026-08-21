import { SectionType } from '@cc/types';
import { STOREFRONT_FONTS } from '@cc/shared';

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
  defaultValue?: number;
  options?: Array<{ value: string; label: string }>;
}

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' },
];

const COLUMNS: SectionField = { key: 'columns', label: 'Columns', kind: 'number', min: 1, max: 6 };
const TITLE: SectionField = { key: 'title', label: 'Heading', kind: 'text' };
const SHARED_STYLE_FIELDS: SectionField[] = [
  { key: 'sectionFont', label: 'Section font', kind: 'select', options: STOREFRONT_FONTS.map((font) => ({ value: font.family, label: `${font.family} · ${font.category}` })) },
  { key: 'sectionAlignment', label: 'Section alignment', kind: 'select', options: ALIGNMENT_OPTIONS },
  { key: 'sectionHeadingSize', label: 'Heading size', kind: 'number', min: 16, max: 120, defaultValue: 48 },
  { key: 'sectionTextColor', label: 'Text colour', kind: 'text', placeholder: '#ffffff' },
  { key: 'sectionBackground', label: 'Background colour', kind: 'text', placeholder: '#111111' },
];

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
    {
      key: 'headingFont',
      label: 'Heading style',
      kind: 'select',
      options: STOREFRONT_FONTS.map((font) => ({ value: font.family, label: `${font.family} · ${font.category}` })),
    },
    { key: 'headingSize', label: 'Heading size', kind: 'number', min: 32, max: 160, defaultValue: 96 },
    {
      key: 'headingWeight',
      label: 'Font weight',
      kind: 'select',
      options: [100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => ({ value: String(weight), label: String(weight) })),
    },
    { key: 'headingLetterSpacing', label: 'Letter spacing', kind: 'number', min: -12, max: 30, defaultValue: -4 },
    {
      key: 'headingTransform',
      label: 'Letter case',
      kind: 'select',
      options: [
        { value: 'none', label: 'Original' },
        { value: 'uppercase', label: 'UPPERCASE' },
        { value: 'lowercase', label: 'lowercase' },
        { value: 'capitalize', label: 'Title Case' },
      ],
    },
    { key: 'contentX', label: 'Horizontal position (%)', kind: 'number', min: 0, max: 100, defaultValue: 4 },
    { key: 'contentY', label: 'Vertical position (%)', kind: 'number', min: 0, max: 100, defaultValue: 70 },
    { key: 'textColor', label: 'Text colour', kind: 'text', placeholder: '#ffffff' },
    { key: 'buttonBackground', label: 'Button colour', kind: 'text', placeholder: '#22d3ee' },
    { key: 'buttonTextColor', label: 'Button text colour', kind: 'text', placeholder: '#050509' },
    { key: 'buttonOffsetX', label: 'Button horizontal offset', kind: 'number', min: -500, max: 500, defaultValue: 0 },
    { key: 'buttonOffsetY', label: 'Button vertical offset', kind: 'number', min: -500, max: 500, defaultValue: 0 },
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

  [SectionType.MARQUEE]: [
    {
      key: 'items',
      label: 'Ticker items',
      kind: 'textarea',
      hint: 'Separate each item with a vertical bar ( | ).',
      placeholder: 'NEW DROP|LIVE NOW|JOIN THE COMMUNITY',
    },
    { key: 'separator', label: 'Separator', kind: 'text', placeholder: '///' },
    { key: 'speed', label: 'Loop duration (seconds)', kind: 'number', min: 6, max: 90 },
    {
      key: 'direction',
      label: 'Direction',
      kind: 'select',
      options: [
        { value: 'left', label: 'Right to left' },
        { value: 'right', label: 'Left to right' },
      ],
    },
    { key: 'backgroundColor', label: 'Background colour', kind: 'text', placeholder: '#070810' },
    { key: 'textColor', label: 'Text colour', kind: 'text', placeholder: '#b9c2d6' },
    { key: 'accentColor', label: 'Accent colour', kind: 'text', placeholder: '#d958ff' },
  ],

  [SectionType.FOOTER]: [
    { key: 'text', label: 'Footer text', kind: 'textarea' },
    { key: 'showSocials', label: 'Show social links', kind: 'boolean' },
    { key: 'links', label: 'Footer links', kind: 'links' },
  ],
};

export function fieldsFor(type: SectionType): SectionField[] {
  const fields = SECTION_FIELDS[type] ?? [];
  return type === SectionType.HEADER || type === SectionType.FOOTER || type === SectionType.HERO
    ? fields
    : [...fields, ...SHARED_STYLE_FIELDS];
}
