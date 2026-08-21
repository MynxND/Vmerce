'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ExternalLink, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PRODUCT_CATEGORIES, buildSku, cartesian, slugify } from '@cc/shared';
import { FulfillmentType, InventoryMode, ProductStatus } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/field';
import { PageHeader } from '@/components/page-header';
import { collectionKeys, collectionsApi } from '@/features/collections/api';
import { productKeys, productsApi } from '@/features/products/api';
import { useActiveStoreId, useActiveStoreSummary } from '@/hooks/use-active-store';
import { ApiClientError, errorMessage } from '@/lib/api-error';
import { storeUrl } from '@/lib/utils';
import { MediaInput } from './media-input';
import { OptionBuilder } from './option-builder';
import { VariantTable } from './variant-table';
import {
  emptyProductForm,
  fromProductDto,
  productFormSchema,
  toProductPayload,
  type ProductFormValues,
  type VariantField,
} from './form-schema';

const STATUS_OPTIONS = [
  { value: ProductStatus.DRAFT, label: 'Draft — not visible in your shop' },
  { value: ProductStatus.ACTIVE, label: 'Active — on sale' },
  { value: ProductStatus.ARCHIVED, label: 'Archived — hidden, kept for records' },
];

const FULFILLMENT_OPTIONS = [
  { value: FulfillmentType.MANUAL, label: 'Manual — you pack and ship' },
  { value: FulfillmentType.STOCK, label: 'From stock' },
  { value: FulfillmentType.PRINT_ON_DEMAND, label: 'Print on demand' },
  { value: FulfillmentType.DROPSHIP, label: 'Dropship' },
  { value: FulfillmentType.DIGITAL, label: 'Digital download' },
];

const INVENTORY_OPTIONS = [
  { value: InventoryMode.NOT_TRACKED, label: 'Do not track stock' },
  { value: InventoryMode.TRACKED, label: 'Track stock, stop at zero' },
  { value: InventoryMode.TRACKED_ALLOW_BACKORDER, label: 'Track stock, allow backorders' },
];

interface ProductFormProps {
  productId?: string;
}

function firstValidationMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  if ('message' in value && typeof value.message === 'string') return value.message;
  for (const child of Object.values(value)) {
    const message = firstValidationMessage(child);
    if (message) return message;
  }
  return null;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeId = useActiveStoreId();
  const store = useActiveStoreSummary();
  const isEdit = Boolean(productId);

  const productQuery = useQuery({
    queryKey: productKeys.detail(storeId ?? 'none', productId ?? 'new'),
    queryFn: () => productsApi.get(storeId!, productId!),
    enabled: Boolean(storeId && productId),
  });

  const collectionsQuery = useQuery({
    queryKey: collectionKeys.list(storeId ?? 'none'),
    queryFn: () => collectionsApi.list(storeId!, { perPage: 100 }),
    enabled: Boolean(storeId),
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductForm(),
  });

  // Hydrate once the product arrives; `reset` keeps dirty tracking accurate.
  React.useEffect(() => {
    if (productQuery.data) {
      const values = fromProductDto(productQuery.data);
      form.reset(values);
      // Radix Select can briefly publish an empty value while an async form is
      // hydrating. Re-assert persisted enums so an untouched product remains
      // valid and the controls never render blank.
      form.setValue('status', values.status, { shouldDirty: false });
      form.setValue('inventoryMode', values.inventoryMode, { shouldDirty: false });
      form.setValue('fulfillmentType', values.fulfillmentType, { shouldDirty: false });
    }
  }, [productQuery.data, form]);

  const options = form.watch('options');
  const variants = form.watch('variants');
  const media = form.watch('media');
  const title = form.watch('title');
  const collectionIds = form.watch('collectionIds');
  const currency = productQuery.data?.currency ?? 'THB';

  /**
   * Expands the option matrix, keeping edits to combinations that still exist.
   * Matching is by the joined option values, so renaming a value creates a new
   * row rather than silently rewriting the old one's stock.
   */
  const generateVariants = () => {
    const cleaned = options
      .map((option) => ({
        name: option.name.trim(),
        values: option.values.map((value) => value.value.trim()).filter(Boolean),
      }))
      .filter((option) => option.name && option.values.length > 0);

    if (cleaned.length === 0) {
      toast.error('Add an option name and at least one value first');
      return;
    }

    const existing = new Map(variants.map((variant) => [variant.optionValues.join('|'), variant]));
    const basePrice = form.getValues('price');

    const next: VariantField[] = cartesian(cleaned.map((option) => option.values)).map(
      (combination) => {
        const key = combination.join('|');
        const previous = existing.get(key);
        return (
          previous ?? {
            optionValues: combination,
            title: combination.join(' / '),
            sku: buildSku(title || 'product', combination),
            price: basePrice,
            compareAtPrice: '',
            cost: '',
            stock: 0,
            enabled: true,
            imageUrl: '',
            supplierSku: '',
          }
        );
      },
    );

    form.setValue('variants', next, { shouldDirty: true });
    toast.success(`${next.length} variant${next.length === 1 ? '' : 's'} ready`);
  };

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = toProductPayload(values);
      return isEdit
        ? productsApi.update(storeId!, productId!, payload)
        : productsApi.create(storeId!, payload);
    },
    onSuccess: (product) => {
      toast.success(isEdit ? 'Product saved' : 'Product created');
      void queryClient.invalidateQueries({ queryKey: productKeys.all(storeId!) });
      if (!isEdit) router.replace(`/dashboard/products/${product.id}`);
      else form.reset(fromProductDto(product));
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        Object.entries(error.fieldErrors()).forEach(([path, message]) => {
          form.setError(path as keyof ProductFormValues, { message });
        });
      }
      toast.error(errorMessage(error, 'Could not save the product'));
    },
  });

  const remove = useMutation({
    mutationFn: () => productsApi.remove(storeId!, productId!),
    onSuccess: () => {
      toast.success('Product deleted');
      void queryClient.invalidateQueries({ queryKey: productKeys.all(storeId!) });
      router.replace('/dashboard/products');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const submitValidated = form.handleSubmit(
    (values) => save.mutate(values),
    (errors) => {
      const firstField = Object.keys(errors)[0] as keyof ProductFormValues | undefined;
      if (firstField) form.setFocus(firstField);
      toast.error(firstValidationMessage(errors) ?? 'Please check the highlighted fields before saving');
    },
  );
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const current = form.getValues();
    if (!current.status) {
      form.setValue('status', productQuery.data?.status ?? ProductStatus.DRAFT);
    }
    if (!current.inventoryMode) {
      form.setValue('inventoryMode', productQuery.data?.inventoryMode ?? InventoryMode.NOT_TRACKED);
    }
    if (!current.fulfillmentType) {
      form.setValue('fulfillmentType', productQuery.data?.fulfillmentType ?? FulfillmentType.MANUAL);
    }
    void submitValidated(event);
  };

  if (isEdit && productQuery.isPending) {
    return <p className="text-muted-foreground py-16 text-center text-sm">Loading product…</p>;
  }

  if (isEdit && productQuery.isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">
          {errorMessage(productQuery.error, 'That product could not be loaded.')}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <PageHeader
        eyebrow={isEdit ? 'Edit product' : 'New product'}
        title={title || 'Untitled product'}
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/products">
                <ArrowLeft /> Products
              </Link>
            </Button>
            {isEdit && store && productQuery.data?.status === ProductStatus.ACTIVE && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={storeUrl(store.handle, `/products/${productQuery.data.slug}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink /> View
                </a>
              </Button>
            )}
            <Button type="submit" loading={save.isPending}>
              <Save /> {isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Title"
                htmlFor="title"
                error={form.formState.errors.title?.message}
                required
              >
                <Input
                  id="title"
                  {...form.register('title')}
                  onBlur={(event) => {
                    // Fill the slug from the title the first time only.
                    if (!form.getValues('slug')) {
                      form.setValue('slug', slugify(event.target.value), { shouldDirty: true });
                    }
                  }}
                  placeholder="Cyber Neko MagSafe Case"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                hint={
                  store
                    ? `${storeUrl(store.handle)}/products/${form.watch('slug') || 'your-product'}`
                    : undefined
                }
                error={form.formState.errors.slug?.message}
              >
                <Input id="slug" {...form.register('slug')} placeholder="cyber-neko-magsafe-case" />
              </Field>

              <Field
                label="Description"
                htmlFor="description"
                hint="What it is made of, how it ships, why someone wants it."
                error={form.formState.errors.description?.message}
              >
                <Textarea id="description" rows={7} {...form.register('description')} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>The first image is used as the thumbnail.</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaInput
                storeId={storeId}
                media={media}
                onChange={(next) => form.setValue('media', next, { shouldDirty: true })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>
                Up to four options. Add a group label to values when a list gets long — the
                storefront turns it into a two-step selector.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptionBuilder
                options={options}
                onChange={(next) => form.setValue('options', next, { shouldDirty: true })}
                onGenerate={generateVariants}
                variantCount={variants.length}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                Each row is separately priced and stocked, and can map to a supplier SKU later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariantTable
                options={options}
                variants={variants}
                currency={currency}
                onChange={(next) => form.setValue('variants', next, { shouldDirty: true })}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field label="Visibility" htmlFor="status">
                    <Select value={field.value || productQuery.data?.status || ProductStatus.DRAFT} onValueChange={(value) => value && field.onChange(value)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Field label="Category" htmlFor="category">
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Base price. Variants can override it individually.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label={`Price (${currency})`}
                htmlFor="price"
                error={form.formState.errors.price?.message}
                required
              >
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="890"
                  {...form.register('price')}
                />
              </Field>

              <Field
                label="Compare at price"
                htmlFor="compareAtPrice"
                hint="Shown struck through, for sales."
                error={form.formState.errors.compareAtPrice?.message}
              >
                <Input
                  id="compareAtPrice"
                  inputMode="decimal"
                  placeholder="1090"
                  {...form.register('compareAtPrice')}
                />
              </Field>

              <Field
                label="Cost per item"
                htmlFor="cost"
                hint="Only you see this. Used for margin reporting."
                error={form.formState.errors.cost?.message}
              >
                <Input id="cost" inputMode="decimal" placeholder="320" {...form.register('cost')} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory & fulfillment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={form.control}
                name="inventoryMode"
                render={({ field }) => (
                  <Field label="Stock tracking" htmlFor="inventoryMode">
                    <Select value={field.value || productQuery.data?.inventoryMode || InventoryMode.NOT_TRACKED} onValueChange={(value) => value && field.onChange(value)}>
                      <SelectTrigger id="inventoryMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVENTORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="fulfillmentType"
                render={({ field }) => (
                  <Field
                    label="Fulfillment"
                    htmlFor="fulfillmentType"
                    hint="Print-on-demand and dropship providers connect in Phase 3."
                  >
                    <Select value={field.value || productQuery.data?.fulfillmentType || FulfillmentType.MANUAL} onValueChange={(value) => value && field.onChange(value)}>
                      <SelectTrigger id="fulfillmentType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FULFILLMENT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(collectionsQuery.data?.items.length ?? 0) === 0 && (
                <p className="text-muted-foreground text-sm">
                  No collections yet.{' '}
                  <Link href="/dashboard/collections" className="text-primary hover:underline">
                    Create one
                  </Link>
                  .
                </p>
              )}
              {collectionsQuery.data?.items.map((collection) => {
                const checked = collectionIds.includes(collection.id);
                return (
                  <label
                    key={collection.id}
                    className="flex cursor-pointer items-center gap-2.5 py-1"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        form.setValue(
                          'collectionIds',
                          value === true
                            ? [...collectionIds, collection.id]
                            : collectionIds.filter((id) => id !== collection.id),
                          { shouldDirty: true },
                        )
                      }
                    />
                    <span className="text-sm">{collection.name}</span>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="SEO title"
                htmlFor="seoTitle"
                error={form.formState.errors.seoTitle?.message}
              >
                <Input id="seoTitle" maxLength={70} {...form.register('seoTitle')} />
              </Field>
              <Field
                label="SEO description"
                htmlFor="seoDescription"
                error={form.formState.errors.seoDescription?.message}
              >
                <Textarea
                  id="seoDescription"
                  rows={3}
                  maxLength={160}
                  {...form.register('seoDescription')}
                />
              </Field>
            </CardContent>
          </Card>

          {isEdit && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
                <CardDescription>
                  Deleting removes the product from your shop. Past orders keep their snapshots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="destructive"
                  loading={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  <Trash2 /> Delete product
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky save bar keeps the primary action reachable on long forms. */}
      {form.formState.isDirty && (
        <div className="border-border bg-card/95 shadow-pop sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 backdrop-blur">
          <p className="text-muted-foreground text-sm">You have unsaved changes.</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => form.reset()}>
              Discard
            </Button>
            <Button type="submit" loading={save.isPending}>
              <Save /> Save
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
