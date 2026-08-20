import type { Store, StorePage, StoreSection, StoreTheme } from '@prisma/client';
import type {
  CreatorType,
  SectionType,
  StoreDto,
  StorePageDto,
  StoreSectionDto,
  StoreStatus,
  StoreThemeDto,
  ThemeColors,
  ThemeEffects,
  ThemeLayout,
  ThemePreset,
  ThemeTypography,
} from '@cc/types';

function asRecord(value: unknown): Record<string, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return {};
}

export function toStoreDto(store: Store): StoreDto {
  return {
    id: store.id,
    name: store.name,
    handle: store.handle,
    description: store.description,
    creatorType: store.creatorType as CreatorType,
    logoUrl: store.logoUrl,
    avatarUrl: store.avatarUrl,
    bannerUrl: store.bannerUrl,
    status: store.status as StoreStatus,
    currency: store.currency,
    country: store.country,
    customDomain: store.customDomain,
    socialLinks: asRecord(store.socialLinks),
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

export function toThemeDto(theme: StoreTheme): StoreThemeDto {
  return {
    id: theme.id,
    storeId: theme.storeId,
    preset: theme.preset as ThemePreset,
    colors: theme.colors as unknown as ThemeColors,
    typography: theme.typography as unknown as ThemeTypography,
    layout: theme.layout as unknown as ThemeLayout,
    effects: theme.effects as unknown as ThemeEffects,
    buttonStyle: theme.buttonStyle,
    colorMode: theme.colorMode,
    faviconUrl: theme.faviconUrl,
    updatedAt: theme.updatedAt.toISOString(),
  };
}

export function toSectionDto(section: StoreSection): StoreSectionDto {
  return {
    id: section.id,
    pageId: section.pageId,
    type: section.type as SectionType,
    position: section.position,
    visible: section.visible,
    settings: (section.settings ?? {}) as Record<string, unknown>,
  };
}

export function toPageDto(page: StorePage & { sections: StoreSection[] }): StorePageDto {
  return {
    id: page.id,
    storeId: page.storeId,
    slug: page.slug,
    title: page.title,
    isHome: page.isHome,
    sections: page.sections.map(toSectionDto),
  };
}
