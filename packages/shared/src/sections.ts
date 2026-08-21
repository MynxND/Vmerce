import { SectionType } from '@cc/types';

export interface SectionDefinition {
  type: SectionType;
  label: string;
  description: string;
  /** Header/footer are fixed chrome and cannot be removed or reordered. */
  locked: boolean;
  defaultSettings: Record<string, unknown>;
}

export const SECTION_LIBRARY: SectionDefinition[] = [
  {
    type: SectionType.HEADER,
    label: 'Header',
    description: 'Store logo, navigation and cart.',
    locked: true,
    defaultSettings: { showSearch: false, showCart: true, sticky: true, links: [] },
  },
  {
    type: SectionType.HERO,
    label: 'Hero',
    description: 'Large intro with headline and call to action.',
    locked: false,
    defaultSettings: {
      title: 'Welcome to my shop',
      subtitle: 'Official creator merchandise',
      buttonText: 'Shop Now',
      buttonUrl: '/collections/all',
      alignment: 'center',
      imageUrl: null,
      contentX: 50,
      contentY: 70,
      headingFont: 'Anton',
      headingSize: 96,
      headingWeight: 900,
      headingLetterSpacing: -4,
      headingTransform: 'uppercase',
      textColor: '#ffffff',
      buttonBackground: '#22d3ee',
      buttonTextColor: '#050509',
      buttonOffsetX: 0,
      buttonOffsetY: 0,
    },
  },
  {
    type: SectionType.FEATURED_PRODUCTS,
    label: 'Featured products',
    description: 'Hand-picked products or a collection.',
    locked: false,
    defaultSettings: { title: 'Featured', collectionSlug: null, limit: 4, columns: 4 },
  },
  {
    type: SectionType.PRODUCT_GRID,
    label: 'Product grid',
    description: 'All products in a paginated grid.',
    locked: false,
    defaultSettings: { title: 'All products', limit: 12, columns: 3 },
  },
  {
    type: SectionType.COLLECTION_LIST,
    label: 'Collection list',
    description: 'Links out to each collection.',
    locked: false,
    defaultSettings: { title: 'Shop by collection', columns: 3 },
  },
  {
    type: SectionType.IMAGE_BANNER,
    label: 'Image banner',
    description: 'Full-width image with optional overlay text.',
    locked: false,
    defaultSettings: { imageUrl: null, title: '', subtitle: '', linkUrl: null, height: 'medium' },
  },
  {
    type: SectionType.TEXT_BLOCK,
    label: 'Text block',
    description: 'Rich text for announcements or an about section.',
    locked: false,
    defaultSettings: { title: '', body: '', alignment: 'left' },
  },
  {
    type: SectionType.IMAGE_WITH_TEXT,
    label: 'Image with text',
    description: 'Side-by-side image and copy.',
    locked: false,
    defaultSettings: {
      imageUrl: null,
      title: '',
      body: '',
      imagePosition: 'left',
      buttonText: '',
      buttonUrl: '',
    },
  },
  {
    type: SectionType.GALLERY,
    label: 'Gallery',
    description: 'Artwork grid.',
    locked: false,
    defaultSettings: { title: 'Gallery', images: [], columns: 3 },
  },
  {
    type: SectionType.VIDEO,
    label: 'Video',
    description: 'Embedded YouTube or Twitch clip.',
    locked: false,
    defaultSettings: { title: '', url: '', autoplay: false },
  },
  {
    type: SectionType.SOCIAL_LINKS,
    label: 'Social links',
    description: 'Where to find the creator.',
    locked: false,
    defaultSettings: { title: 'Follow me', links: [] },
  },
  {
    type: SectionType.NEWSLETTER,
    label: 'Newsletter',
    description: 'Email capture for drop announcements.',
    locked: false,
    defaultSettings: {
      title: 'Never miss a drop',
      subtitle: 'Get notified when new merch goes live.',
      buttonText: 'Subscribe',
    },
  },
  {
    type: SectionType.MARQUEE,
    label: 'Scrolling marquee',
    description: 'A continuous ticker for announcements, links, or highlights.',
    locked: false,
    defaultSettings: {
      items: 'VTUBER DIRECTORY|AI INSIGHTS|CREATOR BRANDING|RE:STREAM|SCHEDULE BUILDER|GROW TOGETHER|LIVE NOW',
      separator: '///',
      speed: 24,
      direction: 'left',
      backgroundColor: '#070810',
      textColor: '#b9c2d6',
      accentColor: '#d958ff',
    },
  },
  {
    type: SectionType.FOOTER,
    label: 'Footer',
    description: 'Policies, socials and credits.',
    locked: true,
    defaultSettings: { showSocials: true, text: '', links: [] },
  },
];

export function getSectionDefinition(type: SectionType): SectionDefinition {
  const found = SECTION_LIBRARY.find((entry) => entry.type === type);
  if (!found) throw new Error(`Unknown section type: ${type}`);
  return found;
}

export function defaultSettingsFor(type: SectionType): Record<string, unknown> {
  return structuredClone(getSectionDefinition(type).defaultSettings);
}

/** Section stack a brand-new store's home page starts with. */
export const DEFAULT_HOME_SECTIONS: SectionType[] = [
  SectionType.HEADER,
  SectionType.HERO,
  SectionType.FEATURED_PRODUCTS,
  SectionType.COLLECTION_LIST,
  SectionType.TEXT_BLOCK,
  SectionType.SOCIAL_LINKS,
  SectionType.FOOTER,
];
