import type { Prisma } from '@prisma/client';
import { InventoryMode, OrderStatus, PaymentStatus } from '@cc/types';
import type { OrderDto, PaymentInstructionDto, PaymentProofDto } from '@cc/types';
import { findShippingOption, skuToken, type CheckoutInput } from '@cc/shared';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { cartRepository } from '../repositories/cart.repository';
import { customerRepository } from '../repositories/customer.repository';
import { storeRepository } from '../repositories/store.repository';
import { toOrderDto } from '../mappers/order.mapper';
import { ApiError } from '../utils/errors';
import { priceCart } from './pricing.service';
import { paymentChannelService } from './payment-channel.service';
import { buildPaymentInstruction } from './payment-instruction.service';
import { getPaymentProvider } from '../modules/payments/registry';
import { getFulfillmentAdapter } from '../modules/fulfillment/registry';
import { orderRepository } from '../repositories/order.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { toPaymentProofDto } from '../mappers/payment.mapper';

function orderNumberFor(handle: string, sequence: number): string {
  return `${skuToken(handle, 5)}-${String(1000 + sequence)}`;
}

export const checkoutService = {
  /**
   * Converts a cart into an order.
   *
   * Everything money-related is recomputed server-side, stock is decremented
   * inside the same transaction as the order insert, and each line is written as
   * an immutable snapshot so later catalogue edits cannot rewrite history.
   */
  async placeOrder(input: CheckoutInput): Promise<OrderDto> {
    const cart = await cartRepository.findByToken(input.cartToken);
    if (!cart) throw ApiError.notFound('Cart not found', 'CART_NOT_FOUND');
    if (cart.items.length === 0) throw ApiError.badRequest('Your cart is empty', 'CART_EMPTY');

    const store = await storeRepository.findById(cart.storeId);
    if (!store) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');

    const shippingOption = findShippingOption(input.shippingOptionId);
    if (!shippingOption) throw ApiError.badRequest('Choose a valid shipping option');

    const unavailable = cart.items.filter(
      (item) => !item.variant.enabled || item.variant.product.status !== 'ACTIVE',
    );
    if (unavailable.length > 0) {
      throw ApiError.badRequest(
        `No longer available: ${unavailable.map((item) => item.variant.title).join(', ')}`,
      );
    }

    const totals = await priceCart(cart, { shippingOptionId: input.shippingOptionId });
    const customerName =
      `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`.trim();

    // A store that has configured its own PromptPay / bank / e-wallet details
    // collects through that channel; otherwise fall back to the generic manual
    // provider so checkout still completes.
    const channel = await paymentChannelService.resolveForCheckout(
      store.id,
      input.paymentChannelId,
    );
    const provider = getPaymentProvider(channel ? 'manual' : input.paymentProvider);

    const order = await prisma.$transaction(async (tx) => {
      // Re-read stock inside the transaction so two simultaneous checkouts of the
      // last item cannot both succeed.
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, title: true, product: { select: { inventoryMode: true } } },
        });
        if (!variant) throw ApiError.badRequest('An item in your cart is no longer available');

        const tracked = variant.product.inventoryMode === InventoryMode.TRACKED;
        if (tracked && variant.stock < item.quantity) {
          throw ApiError.badRequest(
            `${variant.title} only has ${variant.stock} left`,
            'OUT_OF_STOCK',
          );
        }
        if (variant.product.inventoryMode !== InventoryMode.NOT_TRACKED) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      const customer = await customerRepository.upsertForCheckout(
        {
          storeId: store.id,
          email: input.email,
          name: customerName,
          phone: input.phone ?? input.shippingAddress.phone ?? null,
        },
        tx,
      );

      const sequence = await storeRepository.nextOrderSequence(store.id, tx);

      const created = await orderRepository.create(
        {
          store: { connect: { id: store.id } },
          customer: { connect: { id: customer.id } },
          orderNumber: orderNumberFor(store.handle, sequence),
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          currency: store.currency,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          shippingTotal: totals.shippingTotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          discountCode: cart.discountCode,
          email: input.email,
          phone: input.phone ?? input.shippingAddress.phone ?? null,
          customerName,
          note: input.note ?? null,
          paymentProvider: channel ? `channel:${channel.type}` : provider.key,
          ...(channel ? { paymentChannel: { connect: { id: channel.id } } } : {}),
          shippingMethod: shippingOption.label,
          items: {
            create: cart.items.map((item) => ({
              productId: item.variant.product.id,
              variantId: item.variantId,
              productTitle: item.variant.product.title,
              variantTitle: item.variant.title,
              sku: item.variant.sku,
              imageUrl: item.variant.imageUrl,
              unitPrice: item.variant.price,
              quantity: item.quantity,
              lineTotal: item.variant.price * item.quantity,
              snapshot: {
                productSlug: item.variant.product.slug,
                optionValues: item.variant.optionValues.map((row) => row.optionValue.value),
                supplierSku: item.variant.supplierSku,
              } as Prisma.InputJsonValue,
            })),
          },
          addresses: {
            create: {
              kind: 'SHIPPING',
              firstName: input.shippingAddress.firstName,
              lastName: input.shippingAddress.lastName,
              phone: input.shippingAddress.phone ?? null,
              line1: input.shippingAddress.line1,
              line2: input.shippingAddress.line2 ?? null,
              district: input.shippingAddress.district ?? null,
              province: input.shippingAddress.province,
              postalCode: input.shippingAddress.postalCode,
              country: input.shippingAddress.country,
            },
          },
        },
        tx,
      );

      await customerRepository.recordOrder(customer.id, totals.total, tx);
      if (totals.discount) {
        await tx.discount.update({
          where: { id: totals.discount.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      await cartRepository.clearItems(cart.id, tx);
      await tx.cart.update({ where: { id: cart.id }, data: { discountCode: null } });

      return created;
    });

    // Side effects that must not roll the order back if they fail.
    if (channel) {
      try {
        const instruction = await buildPaymentInstruction({
          channel,
          amount: order.total,
          currency: order.currency,
          reference: order.orderNumber,
          storeName: store.name,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentReference: order.orderNumber,
            // Snapshot what the buyer was told to pay, so editing or deleting
            // the channel later cannot rewrite an existing order's instructions.
            paymentInstruction: instruction as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        logger.error(`Could not build payment instruction for ${order.orderNumber}`, error);
      }
    } else {
      try {
        const intent = await provider.createPayment({
          orderId: order.id,
          orderNumber: order.orderNumber,
          storeId: store.id,
          currency: order.currency,
          amount: order.total,
          email: order.email,
          description: `Order ${order.orderNumber} — ${store.name}`,
          returnUrl: `${env.WEB_URL}/@${store.handle}/orders/${order.orderNumber}`,
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentReference: intent.reference },
        });
      } catch (error) {
        logger.error(`Payment intent failed for order ${order.orderNumber}`, error);
      }
    }

    try {
      const manual = await prisma.fulfillmentProvider.findFirst({
        where: { storeId: store.id, kind: 'MANUAL' },
      });
      if (manual) {
        const adapter = getFulfillmentAdapter('MANUAL');
        const result = await adapter.createOrder({
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            variantId: item.variantId ?? '',
            supplierSku: (item.snapshot as { supplierSku?: string | null })?.supplierSku ?? null,
            quantity: item.quantity,
            title: `${item.productTitle} — ${item.variantTitle}`,
          })),
          address: {
            firstName: input.shippingAddress.firstName,
            lastName: input.shippingAddress.lastName,
            phone: input.shippingAddress.phone ?? null,
            line1: input.shippingAddress.line1,
            line2: input.shippingAddress.line2 ?? null,
            district: input.shippingAddress.district ?? null,
            province: input.shippingAddress.province,
            postalCode: input.shippingAddress.postalCode,
            country: input.shippingAddress.country,
          },
          shippingMethod: shippingOption.label,
          note: input.note ?? null,
        });
        await prisma.fulfillmentOrder.create({
          data: {
            orderId: order.id,
            providerId: manual.id,
            externalId: result.externalId,
            status: result.status,
            trackingNumber: result.trackingNumber,
            trackingUrl: result.trackingUrl,
            rawResponse: result.raw as Prisma.InputJsonValue,
          },
        });
      }
    } catch (error) {
      logger.error(`Fulfillment draft failed for order ${order.orderNumber}`, error);
    }

    const fresh = await orderRepository.findById(store.id, order.id);
    return toOrderDto(fresh ?? order);
  },

  /**
   * Public order lookup used by the thank-you page (order number + email).
   *
   * Returns the payment instruction snapshot and any slip already submitted, so
   * the page can render the QR and the review state in one round trip.
   */
  async findPublicOrder(
    storeHandle: string,
    orderNumber: string,
    email: string,
  ): Promise<{
    order: OrderDto;
    instruction: PaymentInstructionDto | null;
    proofs: PaymentProofDto[];
  }> {
    const store = await storeRepository.findByHandle(storeHandle);
    if (!store) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');

    const order = await orderRepository.findByNumber(store.id, orderNumber);
    if (!order || order.email.toLowerCase() !== email.toLowerCase()) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    const proofs = await paymentRepository.listProofs(order.id);

    return {
      order: toOrderDto(order),
      // Snapshot taken at checkout, so it still shows the right QR even if the
      // creator has since edited or removed the channel.
      instruction: (order.paymentInstruction as PaymentInstructionDto | null) ?? null,
      proofs: proofs.map(toPaymentProofDto),
    };
  },
};
