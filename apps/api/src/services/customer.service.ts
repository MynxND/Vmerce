import type { Prisma } from '@prisma/client';
import type { CustomerDto, Paginated } from '@cc/types';
import type { PaginationQuery } from '@cc/shared';
import { customerRepository } from '../repositories/customer.repository';
import { toCustomerDto } from '../mappers/customer.mapper';
import { toOrderListItemDto } from '../mappers/order.mapper';
import { ApiError } from '../utils/errors';
import { paginated } from '../utils/response';

export const customerService = {
  async list(storeId: string, query: PaginationQuery): Promise<Paginated<CustomerDto>> {
    const where: Prisma.CustomerWhereInput = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { rows, total } = await customerRepository.list({
      storeId,
      where,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });

    return paginated(rows.map(toCustomerDto), query.page, query.perPage, total);
  },

  async getById(storeId: string, customerId: string) {
    const customer = await customerRepository.findById(storeId, customerId);
    if (!customer) throw ApiError.notFound('Customer not found', 'CUSTOMER_NOT_FOUND');

    return {
      ...toCustomerDto(customer),
      addresses: customer.addresses.map((address) => ({
        id: address.id,
        kind: address.kind,
        isDefault: address.isDefault,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        district: address.district,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
      })),
      orders: customer.orders.map(toOrderListItemDto),
    };
  },
};
