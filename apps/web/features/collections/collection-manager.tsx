'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionStatus } from '@cc/types';
import { slugify } from '@cc/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { PageHeader } from '@/components/page-header';
import { collectionKeys, collectionsApi, type CollectionDetail } from '@/features/collections/api';
import { productKeys, productsApi } from '@/features/products/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { errorMessage } from '@/lib/api-error';

interface DraftCollection {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
  productIds: string[];
}

function emptyDraft(): DraftCollection {
  return {
    id: null,
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    active: true,
    productIds: [],
  };
}

export function CollectionManager() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<DraftCollection | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<{ id: string; name: string } | null>(
    null,
  );

  const listQuery = useQuery({
    queryKey: collectionKeys.list(storeId ?? 'none'),
    queryFn: () => collectionsApi.list(storeId!, { perPage: 100 }),
    enabled: Boolean(storeId),
  });

  // Loaded only while the editor dialog is open.
  const productsQuery = useQuery({
    queryKey: productKeys.list(storeId ?? 'none', { perPage: 100 }),
    queryFn: () => productsApi.list(storeId!, { perPage: 100 }),
    enabled: Boolean(storeId) && draft !== null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: collectionKeys.all(storeId!) });
  };

  const save = useMutation({
    mutationFn: async (value: DraftCollection) => {
      const payload = {
        name: value.name,
        slug: value.slug || slugify(value.name),
        description: value.description || null,
        imageUrl: value.imageUrl || null,
        status: value.active ? CollectionStatus.ACTIVE : CollectionStatus.DRAFT,
        productIds: value.productIds,
      };
      return value.id
        ? collectionsApi.update(storeId!, value.id, payload)
        : collectionsApi.create(storeId!, payload);
    },
    onSuccess: () => {
      toast.success('Collection saved');
      setDraft(null);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (collectionId: string) => collectionsApi.remove(storeId!, collectionId),
    onSuccess: () => {
      toast.success('Collection deleted');
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function openEditor(collectionId: string) {
    try {
      const detail: CollectionDetail = await collectionsApi.get(storeId!, collectionId);
      setDraft({
        id: detail.id,
        name: detail.name,
        slug: detail.slug,
        description: detail.description ?? '',
        imageUrl: detail.imageUrl ?? '',
        active: detail.status === CollectionStatus.ACTIVE,
        productIds: detail.productIds,
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const items = listQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Group products into drops, categories or limited editions."
        actions={
          <Button onClick={() => setDraft(emptyDraft())}>
            <Plus /> New collection
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 pb-0 pt-0">
          {listQuery.isPending ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Boxes}
                title="No collections yet"
                description="Collections power your storefront navigation and the featured sections on your home page."
                action={
                  <Button onClick={() => setDraft(emptyDraft())}>
                    <Plus /> New collection
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Products</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="border-border bg-muted size-10 shrink-0 overflow-hidden rounded-lg border">
                          {collection.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={collection.imageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void openEditor(collection.id)}
                            className="hover:text-primary block max-w-64 truncate text-left font-medium hover:underline"
                          >
                            {collection.name}
                          </button>
                          <span className="text-muted-foreground block font-mono text-xs">
                            /collections/{collection.slug}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          collection.status === CollectionStatus.ACTIVE ? 'success' : 'neutral'
                        }
                      >
                        {collection.status === CollectionStatus.ACTIVE ? 'Active' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {collection.productCount}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${collection.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => void openEditor(collection.id)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onSelect={() =>
                              setPendingDelete({ id: collection.id, name: collection.name })
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

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Edit collection' : 'New collection'}</DialogTitle>
            <DialogDescription>
              Pick a name, then choose which products belong in it.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <Field label="Name" htmlFor="collection-name" required>
                <Input
                  id="collection-name"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      name: event.target.value,
                      slug: draft.id ? draft.slug : slugify(event.target.value),
                    })
                  }
                  placeholder="New Drop"
                />
              </Field>

              <Field label="Slug" htmlFor="collection-slug" hint="Used in the storefront URL.">
                <Input
                  id="collection-slug"
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                  placeholder="new-drop"
                />
              </Field>

              <Field label="Description" htmlFor="collection-description">
                <Textarea
                  id="collection-description"
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </Field>

              <Field label="Cover image URL" htmlFor="collection-image">
                <Input
                  id="collection-image"
                  value={draft.imageUrl}
                  onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
                  placeholder="https://…"
                />
              </Field>

              <label className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">Visible in the storefront</span>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium">Products</p>
                <div className="border-border max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {productsQuery.isPending && <Skeleton className="h-8 w-full" />}
                  {productsQuery.data?.items.length === 0 && (
                    <p className="text-muted-foreground p-2 text-sm">No products yet.</p>
                  )}
                  {productsQuery.data?.items.map((product) => {
                    const checked = draft.productIds.includes(product.id);
                    return (
                      <label
                        key={product.id}
                        className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setDraft({
                              ...draft,
                              productIds:
                                value === true
                                  ? [...draft.productIds, product.id]
                                  : draft.productIds.filter((id) => id !== product.id),
                            })
                          }
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">{product.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!draft?.name.trim()}
              onClick={() => draft && save.mutate(draft)}
            >
              Save collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pendingDelete?.name}”?</DialogTitle>
            <DialogDescription>
              The products stay in your catalogue — only the grouping is removed.
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
