'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MoreHorizontal, Package, PackagePlus, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProductStatus } from '@cc/types';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { ProductStatusBadge } from '@/components/status-badge';
import { productKeys, productsApi } from '@/features/products/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { errorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: ProductStatus.ACTIVE, label: 'Active' },
  { value: ProductStatus.DRAFT, label: 'Drafts' },
  { value: ProductStatus.ARCHIVED, label: 'Archived' },
] as const;

export function ProductList() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [pendingDelete, setPendingDelete] = React.useState<{ id: string; title: string } | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search);

  const query = {
    page,
    perPage: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== 'all' ? { status: status as ProductStatus } : {}),
  };

  const { data, isPending } = useQuery({
    queryKey: productKeys.list(storeId ?? 'none', query),
    queryFn: () => productsApi.list(storeId!, query),
    enabled: Boolean(storeId),
  });

  const duplicate = useMutation({
    mutationFn: (productId: string) => productsApi.duplicate(storeId!, productId),
    onSuccess: (product) => {
      toast.success(`Duplicated as "${product.title}"`);
      void queryClient.invalidateQueries({ queryKey: productKeys.all(storeId!) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (productId: string) => productsApi.remove(storeId!, productId),
    onSuccess: () => {
      toast.success('Product deleted');
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: productKeys.all(storeId!) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Everything you sell, from single stickers to phone cases with forty variants."
        actions={
          <Button asChild>
            <Link href="/dashboard/products/new">
              <PackagePlus /> New product
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative ml-auto w-full sm:w-72">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search title or SKU"
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="px-0 pb-0 pt-0">
          {isPending ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Package}
                title={debouncedSearch ? 'No matches' : 'No products yet'}
                description={
                  debouncedSearch
                    ? 'Try a different title or SKU.'
                    : 'Add your first product to start filling your storefront.'
                }
                action={
                  !debouncedSearch && (
                    <Button asChild>
                      <Link href="/dashboard/products/new">
                        <PackagePlus /> New product
                      </Link>
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Price</TableHead>
                  <TableHead className="hidden md:table-cell">Variants</TableHead>
                  <TableHead className="hidden lg:table-cell">Stock</TableHead>
                  <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="border-border bg-muted size-10 shrink-0 overflow-hidden rounded-lg border">
                          {product.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.thumbnailUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="hover:text-primary block max-w-64 truncate font-medium hover:underline"
                          >
                            {product.title}
                          </Link>
                          <span className="text-muted-foreground block truncate font-mono text-xs">
                            /{product.slug}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      {formatMoney(product.price, { currency: product.currency })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.variantCount}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.totalStock > 0 ? (
                        product.totalStock
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden whitespace-nowrap xl:table-cell">
                      {formatDate(product.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${product.title}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/products/${product.id}`}>
                              <Pencil /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => duplicate.mutate(product.id)}>
                            <Copy /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onSelect={() =>
                              setPendingDelete({ id: product.id, title: product.title })
                            }
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            Page {meta.page} of {meta.totalPages} · {meta.total} products
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pendingDelete?.title}”?</DialogTitle>
            <DialogDescription>
              This removes the product and its variants from your storefront. Past orders keep their
              own snapshot, so order history is not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
