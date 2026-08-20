import type { Request, Response } from 'express';
import type {
  CreateStoreInput,
  OnboardingInput,
  UpdatePageSectionsInput,
  UpdateStoreInput,
  UpdateThemeInput,
} from '@cc/shared';
import { SECTION_LIBRARY, THEME_PRESETS } from '@cc/shared';
import { storeService } from '../services/store.service';
import { ApiError } from '../utils/errors';
import { created, success } from '../utils/response';

export const storeController = {
  async list(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    success(res, await storeService.listForUser(req.auth.userId));
  },

  async create(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    const store = await storeService.create(req.auth.userId, req.body as CreateStoreInput);
    created(res, store, 'Store created');
  },

  async onboard(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    const store = await storeService.completeOnboarding(
      req.auth.userId,
      req.body as OnboardingInput,
    );
    created(res, store, 'Your shop is live');
  },

  async checkHandle(req: Request, res: Response): Promise<void> {
    const { handle } = req.query as { handle: string };
    success(res, { handle, available: await storeService.isHandleAvailable(handle) });
  },

  async getById(req: Request, res: Response): Promise<void> {
    success(res, await storeService.getById(req.params.storeId!));
  },

  async update(req: Request, res: Response): Promise<void> {
    const store = await storeService.update(req.params.storeId!, req.body as UpdateStoreInput);
    success(res, store, 'Store updated');
  },

  async getTheme(req: Request, res: Response): Promise<void> {
    success(res, await storeService.getTheme(req.params.storeId!));
  },

  async updateTheme(req: Request, res: Response): Promise<void> {
    const theme = await storeService.updateTheme(req.params.storeId!, req.body as UpdateThemeInput);
    success(res, theme, 'Theme updated');
  },

  async listPages(req: Request, res: Response): Promise<void> {
    success(res, await storeService.listPages(req.params.storeId!));
  },

  async getPage(req: Request, res: Response): Promise<void> {
    success(res, await storeService.getPageById(req.params.storeId!, req.params.pageId!));
  },

  async updatePage(req: Request, res: Response): Promise<void> {
    const page = await storeService.updatePageSections(
      req.params.storeId!,
      req.params.pageId!,
      req.body as UpdatePageSectionsInput,
    );
    success(res, page, 'Page saved');
  },

  sectionLibrary(_req: Request, res: Response): void {
    success(res, SECTION_LIBRARY);
  },

  presets(_req: Request, res: Response): void {
    success(res, THEME_PRESETS);
  },
};
