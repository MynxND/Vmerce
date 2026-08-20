import type { Request, Response } from 'express';
import { storefrontService } from '../services/storefront.service';
import { checkoutService } from '../services/checkout.service';
import { success } from '../utils/response';

export const storefrontController = {
  async getStore(req: Request, res: Response): Promise<void> {
    success(res, await storefrontService.getStore(req.params.handle!));
  },

  async getHome(req: Request, res: Response): Promise<void> {
    const handle = req.params.handle!;
    const [store, page, collections, products] = await Promise.all([
      storefrontService.getStore(handle),
      storefrontService.getHomePage(handle),
      storefrontService.listCollections(handle),
      storefrontService.listProducts(handle, { limit: 12, page: 1 }),
    ]);
    success(res, { store, page, collections, products: products.items });
  },

  async listProducts(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as { page: number; limit: number; collection?: string };
    success(
      res,
      await storefrontService.listProducts(req.params.handle!, {
        page: query.page,
        limit: query.limit,
        ...(query.collection ? { collectionSlug: query.collection } : {}),
      }),
    );
  },

  async getProduct(req: Request, res: Response): Promise<void> {
    const handle = req.params.handle!;
    const product = await storefrontService.getProduct(handle, req.params.productSlug!);
    const related = await storefrontService.relatedProducts(handle, product.id);
    success(res, { product, related });
  },

  async listCollections(req: Request, res: Response): Promise<void> {
    success(res, await storefrontService.listCollections(req.params.handle!));
  },

  async getCollection(req: Request, res: Response): Promise<void> {
    success(
      res,
      await storefrontService.getCollection(req.params.handle!, req.params.collectionSlug!),
    );
  },

  async checkoutOptions(req: Request, res: Response): Promise<void> {
    success(res, await storefrontService.checkoutOptions(req.params.handle!));
  },

  /** Returns the order plus its payment instruction and any submitted slips. */
  async lookupOrder(req: Request, res: Response): Promise<void> {
    const { orderNumber, email } = req.query as unknown as { orderNumber: string; email: string };
    success(res, await checkoutService.findPublicOrder(req.params.handle!, orderNumber, email));
  },
};
