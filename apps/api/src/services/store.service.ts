import type { Prisma } from '@prisma/client';
import { StoreStatus, UserRole } from '@cc/types';
import type { ThemePreset } from '@cc/types';
import type { StoreDto, StorePageDto, StoreThemeDto } from '@cc/types';
import {
  DEFAULT_HOME_SECTIONS,
  DEFAULT_THEME_PRESET,
  defaultSettingsFor,
  getSectionDefinition,
  getThemePreset,
  parseSectionSettings,
  type CreateStoreInput,
  type OnboardingInput,
  type UpdatePageSectionsInput,
  type UpdateStoreInput,
  type UpdateThemeInput,
} from '@cc/shared';
import { prisma } from '../config/prisma';
import { storeRepository } from '../repositories/store.repository';
import { userRepository } from '../repositories/user.repository';
import { toPageDto, toStoreDto, toThemeDto } from '../mappers/store.mapper';
import { ApiError } from '../utils/errors';

function themeCreateData(
  storeId: string,
  preset: ThemePreset = DEFAULT_THEME_PRESET,
): Prisma.StoreThemeUncheckedCreateInput {
  const definition = getThemePreset(preset);
  return {
    storeId,
    preset: definition.preset,
    colors: definition.colors as unknown as Prisma.InputJsonValue,
    typography: definition.typography as unknown as Prisma.InputJsonValue,
    layout: definition.layout as unknown as Prisma.InputJsonValue,
    effects: definition.effects as unknown as Prisma.InputJsonValue,
    buttonStyle: definition.buttonStyle,
    colorMode: definition.colorMode,
  };
}

/**
 * Creates the store plus everything a storefront needs to render on day one:
 * an owner membership, a theme, and a home page pre-filled with sections.
 */
async function provisionStore(
  userId: string,
  input: CreateStoreInput & { themePreset?: OnboardingInput['themePreset'] },
): Promise<StoreDto> {
  if (await storeRepository.handleExists(input.handle)) {
    throw ApiError.conflict('That store handle is already taken', 'HANDLE_TAKEN');
  }

  const store = await prisma.$transaction(async (tx) => {
    const created = await tx.store.create({
      data: {
        name: input.name,
        handle: input.handle,
        description: input.description ?? null,
        creatorType: input.creatorType,
        logoUrl: input.logoUrl ?? null,
        avatarUrl: input.avatarUrl ?? null,
        currency: input.currency,
        country: input.country,
        status: StoreStatus.ACTIVE,
        members: {
          create: { userId, role: UserRole.STORE_OWNER, acceptedAt: new Date() },
        },
      },
    });

    await tx.storeTheme.create({ data: themeCreateData(created.id, input.themePreset) });

    await tx.storePage.create({
      data: {
        storeId: created.id,
        slug: 'home',
        title: 'Home',
        isHome: true,
        sections: {
          create: DEFAULT_HOME_SECTIONS.map((type, index) => ({
            type,
            position: index,
            settings: defaultSettingsFor(type) as Prisma.InputJsonValue,
          })),
        },
      },
    });

    // Every store gets a manual fulfillment provider so Phase 1 orders have
    // somewhere to live before any POD adapter is connected.
    await tx.fulfillmentProvider.create({
      data: { storeId: created.id, kind: 'MANUAL', name: 'Manual fulfillment', enabled: true },
    });

    return created;
  });

  return toStoreDto(store);
}

export const storeService = {
  async isHandleAvailable(handle: string): Promise<boolean> {
    return !(await storeRepository.handleExists(handle));
  },

  listForUser(userId: string) {
    return storeRepository
      .listForUser(userId)
      .then((rows) => rows.map((row) => toStoreDto(row.store)));
  },

  create(userId: string, input: CreateStoreInput): Promise<StoreDto> {
    return provisionStore(userId, input);
  },

  /** Onboarding wizard: create the store, apply the chosen theme, mark the user onboarded. */
  async completeOnboarding(userId: string, input: OnboardingInput): Promise<StoreDto> {
    const store = await provisionStore(userId, {
      name: input.name,
      handle: input.handle,
      description: input.description ?? null,
      creatorType: input.creatorType,
      logoUrl: input.logoUrl ?? null,
      avatarUrl: input.avatarUrl ?? null,
      currency: input.currency,
      country: input.country,
      themePreset: input.themePreset,
    });

    await userRepository.update(userId, { onboardedAt: new Date() });
    return store;
  },

  async getById(storeId: string): Promise<StoreDto> {
    const store = await storeRepository.findById(storeId);
    if (!store) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');
    return toStoreDto(store);
  },

  async update(storeId: string, input: UpdateStoreInput): Promise<StoreDto> {
    if (input.handle) {
      const existing = await storeRepository.findByHandle(input.handle);
      if (existing && existing.id !== storeId) {
        throw ApiError.conflict('That store handle is already taken', 'HANDLE_TAKEN');
      }
    }

    const data: Prisma.StoreUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.handle !== undefined) data.handle = input.handle;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.creatorType !== undefined) data.creatorType = input.creatorType;
    if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    if (input.bannerUrl !== undefined) data.bannerUrl = input.bannerUrl;
    if (input.status !== undefined) data.status = input.status;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.country !== undefined) data.country = input.country;
    if (input.socialLinks !== undefined)
      data.socialLinks = input.socialLinks as Prisma.InputJsonValue;

    const store = await storeRepository.update(storeId, data);
    return toStoreDto(store);
  },

  async getTheme(storeId: string): Promise<StoreThemeDto> {
    const existing = await storeRepository.findTheme(storeId);
    if (existing) return toThemeDto(existing);
    // Self-heal: a store without a theme row still renders.
    const created = await storeRepository.upsertTheme(storeId, themeCreateData(storeId));
    return toThemeDto(created);
  },

  async updateTheme(storeId: string, input: UpdateThemeInput): Promise<StoreThemeDto> {
    const current = await storeService.getTheme(storeId);

    // Switching preset resets any field the caller did not explicitly override.
    const base =
      input.preset && input.preset !== current.preset ? getThemePreset(input.preset) : current;

    const merged = {
      preset: input.preset ?? current.preset,
      colors: { ...base.colors, ...input.colors },
      typography: { ...base.typography, ...input.typography },
      layout: { ...base.layout, ...input.layout },
      effects: { ...base.effects, ...input.effects },
      buttonStyle: input.buttonStyle ?? base.buttonStyle,
      colorMode: input.colorMode ?? base.colorMode,
      faviconUrl: input.faviconUrl ?? current.faviconUrl,
    };

    const theme = await storeRepository.upsertTheme(storeId, {
      storeId,
      preset: merged.preset,
      colors: merged.colors as unknown as Prisma.InputJsonValue,
      typography: merged.typography as unknown as Prisma.InputJsonValue,
      layout: merged.layout as unknown as Prisma.InputJsonValue,
      effects: merged.effects as unknown as Prisma.InputJsonValue,
      buttonStyle: merged.buttonStyle,
      colorMode: merged.colorMode,
      faviconUrl: merged.faviconUrl,
    });

    return toThemeDto(theme);
  },

  async listPages(storeId: string): Promise<StorePageDto[]> {
    const pages = await storeRepository.findPages(storeId);
    return pages.map(toPageDto);
  },

  async getPage(storeId: string, slug: string): Promise<StorePageDto> {
    const page = await storeRepository.findPageBySlug(storeId, slug);
    if (!page) throw ApiError.notFound('Page not found');
    return toPageDto(page);
  },

  async getPageById(storeId: string, pageId: string): Promise<StorePageDto> {
    const page = await storeRepository.findPageById(storeId, pageId);
    if (!page) throw ApiError.notFound('Page not found');
    return toPageDto(page);
  },

  /**
   * Replaces a page's section stack in one transaction.
   *
   * Array order is the render order. Sections that arrive with an `id` are
   * updated in place so their identity survives a reorder; sections whose id has
   * disappeared from the payload are deleted. Settings are validated against the
   * schema for their own type, so a client cannot smuggle a malformed `limit`
   * into the storefront renderer.
   */
  async updatePageSections(
    storeId: string,
    pageId: string,
    input: UpdatePageSectionsInput,
  ): Promise<StorePageDto> {
    const page = await storeRepository.findPageById(storeId, pageId);
    if (!page) throw ApiError.notFound('Page not found');

    const existingIds = new Set(page.sections.map((section) => section.id));

    const resolved = input.sections.map((section, index) => {
      // An id the caller invented, or one belonging to another page, is treated
      // as a new section rather than trusted.
      const id = section.id && existingIds.has(section.id) ? section.id : null;
      return {
        id,
        type: section.type,
        position: index,
        visible: section.visible,
        settings: parseSectionSettings(section.type, section.settings),
      };
    });

    // Locked sections (header / footer) cannot be hidden — they are the page
    // chrome, and the storefront layout always renders them.
    resolved.forEach((section) => {
      if (getSectionDefinition(section.type).locked) section.visible = true;
    });

    const keptIds = new Set(resolved.map((section) => section.id).filter(Boolean) as string[]);

    await prisma.$transaction(async (tx) => {
      const removed = [...existingIds].filter((id) => !keptIds.has(id));
      if (removed.length > 0) {
        await tx.storeSection.deleteMany({ where: { id: { in: removed } } });
      }

      for (const section of resolved) {
        const data = {
          type: section.type,
          position: section.position,
          visible: section.visible,
          settings: section.settings as Prisma.InputJsonValue,
        };

        if (section.id) {
          await tx.storeSection.update({ where: { id: section.id }, data });
        } else {
          await tx.storeSection.create({ data: { ...data, pageId } });
        }
      }
    });

    return storeService.getPageById(storeId, pageId);
  },
};
