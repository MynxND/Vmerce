'use client';

import * as React from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OptionField } from './form-schema';

interface OptionBuilderProps {
  options: OptionField[];
  onChange: (options: OptionField[]) => void;
  onGenerate: () => void;
  variantCount: number;
  disabled?: boolean;
}

const MAX_OPTIONS = 4;

/**
 * Shopify-style option editor. Values can carry an optional group label, which
 * the storefront uses to split large sets (e.g. Apple vs Samsung devices) into
 * a two-step selector instead of one 40-item list.
 */
export function OptionBuilder({
  options,
  onChange,
  onGenerate,
  variantCount,
  disabled,
}: OptionBuilderProps) {
  const projected = options.reduce(
    (total, option) =>
      total * Math.max(option.values.filter((value) => value.value.trim()).length, 0),
    1,
  );
  const combinations = options.length === 0 ? 0 : projected;

  const update = (index: number, next: OptionField) => {
    onChange(options.map((option, i) => (i === index ? next : option)));
  };

  return (
    <div className="space-y-4">
      {options.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No options yet. Add one for things like device model, size or colour — variants are
          generated for you.
        </p>
      )}

      {options.map((option, optionIndex) => (
        <Card key={optionIndex}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`option-name-${optionIndex}`}>Option name</Label>
                <Input
                  id={`option-name-${optionIndex}`}
                  value={option.name}
                  onChange={(event) => update(optionIndex, { ...option, name: event.target.value })}
                  placeholder="Phone Model"
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove option ${option.name || optionIndex + 1}`}
                disabled={disabled}
                onClick={() => onChange(options.filter((_, i) => i !== optionIndex))}
              >
                <Trash2 />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Values</Label>
              {option.values.map((value, valueIndex) => (
                <div key={valueIndex} className="flex items-center gap-2">
                  <Input
                    value={value.value}
                    onChange={(event) =>
                      update(optionIndex, {
                        ...option,
                        values: option.values.map((current, i) =>
                          i === valueIndex ? { ...current, value: event.target.value } : current,
                        ),
                      })
                    }
                    placeholder="iPhone 17 Pro"
                    disabled={disabled}
                  />
                  <Input
                    value={value.group}
                    onChange={(event) =>
                      update(optionIndex, {
                        ...option,
                        values: option.values.map((current, i) =>
                          i === valueIndex ? { ...current, group: event.target.value } : current,
                        ),
                      })
                    }
                    placeholder="Group (optional)"
                    className="max-w-44"
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove value"
                    disabled={disabled || option.values.length === 1}
                    onClick={() =>
                      update(optionIndex, {
                        ...option,
                        values: option.values.filter((_, i) => i !== valueIndex),
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  update(optionIndex, {
                    ...option,
                    values: [...option.values, { value: '', group: '' }],
                  })
                }
              >
                <Plus /> Add value
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || options.length >= MAX_OPTIONS}
          onClick={() => onChange([...options, { name: '', values: [{ value: '', group: '' }] }])}
        >
          <Plus /> Add option
        </Button>

        {options.length > 0 && (
          <Button type="button" variant="subtle" onClick={onGenerate} disabled={disabled}>
            <Wand2 /> Generate {combinations} variant{combinations === 1 ? '' : 's'}
          </Button>
        )}

        {variantCount > 0 && (
          <p className="text-muted-foreground text-xs">
            {variantCount} variant{variantCount === 1 ? '' : 's'} currently in the table below.
          </p>
        )}
      </div>

      {combinations > 500 && (
        <p className="text-destructive text-sm font-medium">
          That is {combinations} combinations — the limit is 500. Trim some values or split this
          into separate products.
        </p>
      )}
    </div>
  );
}
