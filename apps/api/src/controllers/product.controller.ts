import type { Request, Response } from 'express';
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from '@cc/shared';
import { buildVariantMatrix } from '../services/variant.service';
import { productService } from '../services/product.service';
import { created, noContent, success } from '../utils/response';

export const productController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await productService.list(
      req.params.storeId!,
      req.query as unknown as ProductListQuery,
    );
    success(res, result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    success(res, await productService.getById(req.params.storeId!, req.params.productId!));
  },

  async create(req: Request, res: Response): Promise<void> {
    const product = await productService.create(
      req.params.storeId!,
      req.body as CreateProductInput,
    );
    created(res, product, 'Product created');
  },

  async update(req: Request, res: Response): Promise<void> {
    const product = await productService.update(
      req.params.storeId!,
      req.params.productId!,
      req.body as UpdateProductInput,
    );
    success(res, product, 'Product updated');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await productService.remove(req.params.storeId!, req.params.productId!);
    noContent(res);
  },

  async duplicate(req: Request, res: Response): Promise<void> {
    const product = await productService.duplicate(req.params.storeId!, req.params.productId!);
    created(res, product, 'Product duplicated');
  },

  /**
   * Stateless helper for the product editor: expands options into the full
   * variant matrix without persisting anything.
   */
  generateVariants(req: Request, res: Response): void {
    const body = req.body as { title: string; options: CreateProductInput['options'] };
    success(res, buildVariantMatrix(body.title, body.options ?? []));
  },
};
