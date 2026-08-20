import type { Request, Response } from 'express';
import { mediaService } from '../services/media.service';
import { ApiError } from '../utils/errors';
import { created, noContent, success } from '../utils/response';

export const mediaController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, perPage } = req.query as unknown as { page: number; perPage: number };
    success(res, await mediaService.list(req.params.storeId!, page, perPage));
  },

  async upload(req: Request, res: Response): Promise<void> {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw ApiError.badRequest('No file uploaded');
    created(res, await mediaService.upload(req.params.storeId!, file), 'Uploaded');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await mediaService.remove(req.params.storeId!, req.params.mediaId!);
    noContent(res);
  },
};
