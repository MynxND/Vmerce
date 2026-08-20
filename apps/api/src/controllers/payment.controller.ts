import type { Request, Response } from 'express';
import type {
  CreatePaymentChannelInput,
  ReviewPaymentProofInput,
  SubmitPaymentProofInput,
  UpdatePaymentChannelInput,
} from '@cc/shared';
import { THAI_BANKS } from '@cc/shared';
import { paymentChannelService } from '../services/payment-channel.service';
import { paymentProofService } from '../services/payment-proof.service';
import { ApiError } from '../utils/errors';
import { created, noContent, success } from '../utils/response';

export const paymentController = {
  banks(_req: Request, res: Response): void {
    success(res, THAI_BANKS);
  },

  async listChannels(req: Request, res: Response): Promise<void> {
    success(res, await paymentChannelService.list(req.params.storeId!));
  },

  async getChannel(req: Request, res: Response): Promise<void> {
    success(res, await paymentChannelService.getById(req.params.storeId!, req.params.channelId!));
  },

  async createChannel(req: Request, res: Response): Promise<void> {
    const channel = await paymentChannelService.create(
      req.params.storeId!,
      req.body as CreatePaymentChannelInput,
    );
    created(res, channel, 'Payment method added');
  },

  async updateChannel(req: Request, res: Response): Promise<void> {
    const channel = await paymentChannelService.update(
      req.params.storeId!,
      req.params.channelId!,
      req.body as UpdatePaymentChannelInput,
    );
    success(res, channel, 'Payment method updated');
  },

  async removeChannel(req: Request, res: Response): Promise<void> {
    await paymentChannelService.remove(req.params.storeId!, req.params.channelId!);
    noContent(res);
  },

  async reorderChannels(req: Request, res: Response): Promise<void> {
    const { ids } = req.body as { ids: string[] };
    await paymentChannelService.reorder(req.params.storeId!, ids);
    success(res, { reordered: ids.length });
  },

  // ---- payment proofs ----------------------------------------------------

  async listProofs(req: Request, res: Response): Promise<void> {
    success(res, await paymentProofService.listForOrder(req.params.storeId!, req.params.orderId!));
  },

  async reviewProof(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    const result = await paymentProofService.review(
      req.params.storeId!,
      req.params.proofId!,
      req.auth.userId,
      req.body as ReviewPaymentProofInput,
    );
    success(
      res,
      result,
      (req.body as ReviewPaymentProofInput).approve ? 'Payment confirmed' : 'Slip rejected',
    );
  },

  async pendingCount(req: Request, res: Response): Promise<void> {
    success(res, { pending: await paymentProofService.countPending(req.params.storeId!) });
  },

  /** Public: buyer uploads their transfer slip. */
  async submitProof(req: Request, res: Response): Promise<void> {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw ApiError.badRequest('Attach a photo or screenshot of your transfer slip');

    const proof = await paymentProofService.submit(
      req.params.handle!,
      req.params.orderNumber!,
      req.body as SubmitPaymentProofInput,
      file,
    );
    created(res, proof, 'Slip received — the creator will confirm shortly');
  },
};
