'use client';

import * as React from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import type { OptionField, VariantField } from './form-schema';

interface VariantTableProps {
  options: OptionField[];
  variants: VariantField[];
  onChange: (variants: VariantField[]) => void;
  currency: string;
  disabled?: boolean;
}

export function VariantTable({
  options,
  variants,
  onChange,
  currency,
  disabled,
}: VariantTableProps) {
  const [bulkPrice, setBulkPrice] = React.useState('');
  const [bulkStock, setBulkStock] = React.useState('');

  const update = (index: number, patch: Partial<VariantField>) => {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  };

  if (variants.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No variants yet"
        description="Add options above and generate the matrix, or save the product to create a single default variant."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk edit — indispensable once a phone case has 40 rows. */}
      <div className="border-border bg-muted/50 flex flex-wrap items-end gap-2 rounded-lg border p-3">
        <div className="space-y-1">
          <label htmlFor="bulk-price" className="text-muted-foreground text-xs font-medium">
            Set all prices ({currency})
          </label>
          <Input
            id="bulk-price"
            value={bulkPrice}
            onChange={(event) => setBulkPrice(event.target.value)}
            placeholder="890"
            className="h-8 w-28"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !bulkPrice}
          onClick={() => onChange(variants.map((variant) => ({ ...variant, price: bulkPrice })))}
        >
          Apply
        </Button>

        <div className="ml-4 space-y-1">
          <label htmlFor="bulk-stock" className="text-muted-foreground text-xs font-medium">
            Set all stock
          </label>
          <Input
            id="bulk-stock"
            value={bulkStock}
            onChange={(event) => setBulkStock(event.target.value)}
            placeholder="25"
            className="h-8 w-24"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !bulkStock}
          onClick={() =>
            onChange(variants.map((variant) => ({ ...variant, stock: Number(bulkStock) || 0 })))
          }
        >
          Apply
        </Button>
      </div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {options.length > 0 ? (
                options.map((option, index) => (
                  <TableHead key={index}>{option.name || `Option ${index + 1}`}</TableHead>
                ))
              ) : (
                <TableHead>Variant</TableHead>
              )}
              <TableHead className="w-44">SKU</TableHead>
              <TableHead className="w-28">Price</TableHead>
              <TableHead className="w-24">Stock</TableHead>
              <TableHead className="w-40">Supplier SKU</TableHead>
              <TableHead className="w-20">On sale</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant, index) => (
              <TableRow key={`${variant.optionValues.join('|')}-${index}`}>
                {options.length > 0 ? (
                  options.map((_, optionIndex) => (
                    <TableCell key={optionIndex} className="whitespace-nowrap text-sm">
                      {variant.optionValues[optionIndex] ?? '—'}
                    </TableCell>
                  ))
                ) : (
                  <TableCell className="text-muted-foreground text-sm">Default</TableCell>
                )}

                <TableCell>
                  <Input
                    value={variant.sku}
                    onChange={(event) => update(index, { sku: event.target.value })}
                    placeholder="auto"
                    className="h-8 font-mono text-xs"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={variant.price}
                    onChange={(event) => update(index, { price: event.target.value })}
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={variant.stock}
                    onChange={(event) => update(index, { stock: Number(event.target.value) || 0 })}
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={variant.supplierSku}
                    onChange={(event) => update(index, { supplierSku: event.target.value })}
                    placeholder="CJ-…"
                    className="h-8 font-mono text-xs"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={variant.enabled}
                    onCheckedChange={(checked) => update(index, { enabled: checked })}
                    aria-label="Variant available"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove variant"
                    disabled={disabled}
                    onClick={() => onChange(variants.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
