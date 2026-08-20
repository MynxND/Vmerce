'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { customerKeys, customersApi } from '@/features/customers/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatDate } from '@/lib/utils';

export function CustomerList() {
  const storeId = useActiveStoreId();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isPending } = useQuery({
    queryKey: customerKeys.list(storeId ?? 'none', page, debouncedSearch),
    queryFn: () => customersApi.list(storeId!, { page, search: debouncedSearch || undefined }),
    enabled: Boolean(storeId),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has bought from you, built automatically at checkout."
      />

      <div className="relative w-full sm:w-72">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Name, email or phone"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="px-0 pb-0 pt-0">
          {isPending ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="Customer records are created the first time someone checks out."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total spent</TableHead>
                  <TableHead className="text-right">Last order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="hover:text-primary block max-w-56 truncate font-medium hover:underline"
                      >
                        {customer.name ?? customer.email}
                      </Link>
                      <span className="text-muted-foreground block max-w-56 truncate text-xs">
                        {customer.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {customer.phone ?? '—'}
                    </TableCell>
                    <TableCell>{customer.ordersCount}</TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-right">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} customers
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
