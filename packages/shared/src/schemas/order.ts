import { z } from 'zod';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@cc/types';

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  fulfillmentStatus: z.nativeEnum(FulfillmentStatus).optional(),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const updateOrderSchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    fulfillmentStatus: z.nativeEnum(FulfillmentStatus).optional(),
    trackingNumber: z.string().trim().max(80).nullish(),
    shippingMethod: z.string().trim().max(80).nullish(),
    note: z.string().trim().max(2000).nullish(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Nothing to update',
  });
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
