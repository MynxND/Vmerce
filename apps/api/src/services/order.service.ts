import type { Prisma } from '@prisma/client';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@cc/types';
import type { OrderDto, OrderListItemDto, Paginated } from '@cc/types';
import type { OrderListQuery, UpdateOrderInput } from '@cc/shared';
import { orderRepository } from '../repositories/order.repository';
import { toOrderDto, toOrderListItemDto } from '../mappers/order.mapper';
import { ApiError } from '../utils/errors';
import { paginated } from '../utils/response';

/**
 * Fulfillment progress implies order progress — moving a shipment forward should
 * not require the creator to also remember to bump the order status.
 */
const FULFILLMENT_TO_ORDER: Partial<Record<FulfillmentStatus, OrderStatus>> = {
  [FulfillmentStatus.PROCESSING]: OrderStatus.PROCESSING,
  [FulfillmentStatus.FULFILLED]: OrderStatus.FULFILLED,
  [FulfillmentStatus.SHIPPED]: OrderStatus.SHIPPED,
  [FulfillmentStatus.DELIVERED]: OrderStatus.DELIVERED,
};

export const orderService = {
  async list(storeId: string, query: OrderListQuery): Promise<Paginated<OrderListItemDto>> {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.fulfillmentStatus) where.fulfillmentStatus = query.fulfillmentStatus;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { rows, total } = await orderRepository.list({
      storeId,
      where,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });

    return paginated(rows.map(toOrderListItemDto), query.page, query.perPage, total);
  },

  async getById(storeId: string, orderId: string): Promise<OrderDto> {
    const order = await orderRepository.findById(storeId, orderId);
    if (!order) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    return toOrderDto(order);
  },

  async update(storeId: string, orderId: string, input: UpdateOrderInput): Promise<OrderDto> {
    const existing = await orderRepository.findById(storeId, orderId);
    if (!existing) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');

    const data: Prisma.OrderUpdateInput = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.paymentStatus !== undefined) data.paymentStatus = input.paymentStatus;
    if (input.trackingNumber !== undefined) data.trackingNumber = input.trackingNumber ?? null;
    if (input.shippingMethod !== undefined) data.shippingMethod = input.shippingMethod ?? null;
    if (input.note !== undefined) data.note = input.note ?? null;

    if (input.fulfillmentStatus !== undefined) {
      data.fulfillmentStatus = input.fulfillmentStatus;
      const implied = FULFILLMENT_TO_ORDER[input.fulfillmentStatus];
      if (implied && input.status === undefined) data.status = implied;
    }

    // Confirming payment on a still-pending order also confirms the order.
    if (input.paymentStatus === PaymentStatus.PAID && input.status === undefined) {
      if (existing.status === OrderStatus.PENDING) data.status = OrderStatus.CONFIRMED;
    }

    const order = await orderRepository.update(orderId, data);
    return toOrderDto(order);
  },
};
