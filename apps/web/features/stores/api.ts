import type {
  DashboardOverviewDto,
  MediaDto,
  Paginated,
  StoreDto,
  StorePageDto,
  StoreThemeDto,
} from '@cc/types';
import type {
  CreateStoreInput,
  OnboardingInput,
  SectionDefinition,
  UpdatePageSectionsInput,
  UpdateStoreInput,
  UpdateThemeInput,
} from '@cc/shared';
import { api } from '@/services/http';

export const storesApi = {
  list: () => api.get<StoreDto[]>('/stores'),
  create: (input: CreateStoreInput) => api.post<StoreDto>('/stores', input),
  onboard: (input: OnboardingInput) => api.post<StoreDto>('/stores/onboarding', input),
  checkHandle: (handle: string) =>
    api.get<{ handle: string; available: boolean }>('/stores/check-handle', { query: { handle } }),

  get: (storeId: string) => api.get<StoreDto>(`/stores/${storeId}`),
  update: (storeId: string, input: UpdateStoreInput) =>
    api.patch<StoreDto>(`/stores/${storeId}`, input),

  getTheme: (storeId: string) => api.get<StoreThemeDto>(`/stores/${storeId}/theme`),
  updateTheme: (storeId: string, input: UpdateThemeInput) =>
    api.patch<StoreThemeDto>(`/stores/${storeId}/theme`, input),

  pages: (storeId: string) => api.get<StorePageDto[]>(`/stores/${storeId}/pages`),

  page: (storeId: string, pageId: string) =>
    api.get<StorePageDto>(`/stores/${storeId}/pages/${pageId}`),

  updatePage: (storeId: string, pageId: string, input: UpdatePageSectionsInput) =>
    api.patch<StorePageDto>(`/stores/${storeId}/pages/${pageId}`, input),

  sectionLibrary: () => api.get<SectionDefinition[]>('/stores/section-library'),

  overview: (storeId: string, days: number) =>
    api.get<DashboardOverviewDto>(`/stores/${storeId}/analytics/overview`, { query: { days } }),

  media: (storeId: string, page = 1, perPage = 40) =>
    api.get<Paginated<MediaDto>>(`/stores/${storeId}/media`, { query: { page, perPage } }),

  uploadMedia: (storeId: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api.post<MediaDto>(`/stores/${storeId}/media`, body);
  },

  deleteMedia: (storeId: string, mediaId: string) =>
    api.delete<void>(`/stores/${storeId}/media/${mediaId}`),
};

export const storeKeys = {
  all: ['stores'] as const,
  detail: (storeId: string) => ['stores', storeId] as const,
  theme: (storeId: string) => ['stores', storeId, 'theme'] as const,
  pages: (storeId: string) => ['stores', storeId, 'pages'] as const,
  page: (storeId: string, pageId: string) => ['stores', storeId, 'pages', pageId] as const,
  overview: (storeId: string, days: number) => ['stores', storeId, 'overview', days] as const,
  media: (storeId: string, page: number) => ['stores', storeId, 'media', page] as const,
};
