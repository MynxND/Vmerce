import type { Customer } from '@prisma/client';
import type { CustomerDto } from '@cc/types';

export function toCustomerDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    storeId: customer.storeId,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    ordersCount: customer.ordersCount,
    totalSpent: customer.totalSpent,
    lastOrderAt: customer.lastOrderAt?.toISOString() ?? null,
    note: customer.note,
    createdAt: customer.createdAt.toISOString(),
  };
}
