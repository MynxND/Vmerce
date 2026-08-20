import type { Request, Response } from 'express';
import type { CreateCollectionInput, PaginationQuery, UpdateCollectionInput } from '@cc/shared';
import { collectionService } from '../services/collection.service';
import { created, noContent, success } from '../utils/response';

export const collectionController = {
  async list(req: Request, res: Response): Promise<void> {
    success(
      res,
      await collectionService.list(req.params.storeId!, req.query as unknown as PaginationQuery),
    );
  },

  async getById(req: Request, res: Response): Promise<void> {
    success(res, await collectionService.getById(req.params.storeId!, req.params.collectionId!));
  },

  async create(req: Request, res: Response): Promise<void> {
    const collection = await collectionService.create(
      req.params.storeId!,
      req.body as CreateCollectionInput,
    );
    created(res, collection, 'Collection created');
  },

  async update(req: Request, res: Response): Promise<void> {
    const collection = await collectionService.update(
      req.params.storeId!,
      req.params.collectionId!,
      req.body as UpdateCollectionInput,
    );
    success(res, collection, 'Collection updated');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await collectionService.remove(req.params.storeId!, req.params.collectionId!);
    noContent(res);
  },

  async reorder(req: Request, res: Response): Promise<void> {
    const { ids } = req.body as { ids: string[] };
    await collectionService.reorder(req.params.storeId!, ids);
    success(res, { reordered: ids.length });
  },
};
