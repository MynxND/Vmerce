'use client';

import * as React from 'react';
import type { ProductOptionDto, ProductVariantDto } from '@cc/types';

export interface VariantSelection {
  /** Chosen value per option, indexed by option position. */
  values: (string | null)[];
  variant: ProductVariantDto | null;
}

interface VariantSelectorProps {
  options: ProductOptionDto[];
  variants: ProductVariantDto[];
  selection: VariantSelection;
  onChange: (selection: VariantSelection) => void;
}

function resolveVariant(
  variants: ProductVariantDto[],
  values: (string | null)[],
): ProductVariantDto | null {
  if (values.some((value) => value === null)) return null;
  return (
    variants.find(
      (variant) =>
        variant.optionValues.length === values.length &&
        variant.optionValues.every((value, index) => value === values[index]),
    ) ?? null
  );
}

/**
 * Checks whether picking `value` at `optionIndex` can still lead to a real
 * variant, given everything already chosen. This is what greys out
 * "iPhone 17 / MagSafe" when only the Pro has a MagSafe version.
 */
function isReachable(
  variants: ProductVariantDto[],
  values: (string | null)[],
  optionIndex: number,
  candidate: string,
): boolean {
  return variants.some((variant) => {
    if (!variant.enabled) return false;
    if (variant.optionValues[optionIndex] !== candidate) return false;
    return values.every(
      (chosen, index) =>
        index === optionIndex || chosen === null || variant.optionValues[index] === chosen,
    );
  });
}

export function VariantSelector({ options, variants, selection, onChange }: VariantSelectorProps) {
  // Values carrying a group label get a two-step picker so a 40-device list
  // becomes "brand, then model" instead of one endless row of chips.
  const groupState = React.useMemo(() => {
    const state: Record<number, string | null> = {};
    options.forEach((option, index) => {
      const groups = Array.from(new Set(option.values.map((value) => value.group).filter(Boolean)));
      if (groups.length === 0) return;
      const chosen = selection.values[index];
      const chosenGroup = option.values.find((value) => value.value === chosen)?.group ?? null;
      state[index] = chosenGroup ?? groups[0] ?? null;
    });
    return state;
  }, [options, selection.values]);

  const [activeGroups, setActiveGroups] = React.useState<Record<number, string | null>>(groupState);

  React.useEffect(() => setActiveGroups(groupState), [groupState]);

  const select = (optionIndex: number, value: string) => {
    const next = [...selection.values];
    next[optionIndex] = value;

    // Drop later choices that are no longer reachable after this change.
    for (let index = 0; index < next.length; index += 1) {
      if (index === optionIndex) continue;
      const chosen = next[index];
      if (chosen && !isReachable(variants, next, index, chosen)) next[index] = null;
    }

    onChange({ values: next, variant: resolveVariant(variants, next) });
  };

  return (
    <div className="space-y-6">
      {options.map((option, optionIndex) => {
        const groups = Array.from(
          new Set(
            option.values
              .map((value) => value.group)
              .filter((group): group is string => Boolean(group)),
          ),
        );
        const activeGroup = activeGroups[optionIndex] ?? groups[0] ?? null;
        const visibleValues =
          groups.length > 0
            ? option.values.filter((value) => value.group === activeGroup)
            : option.values;

        return (
          <fieldset key={option.id}>
            <legend className="mb-2.5 text-sm font-medium">
              {option.name}
              {selection.values[optionIndex] && (
                <span className="storefront-muted ml-2 font-normal">
                  {selection.values[optionIndex]}
                </span>
              )}
            </legend>

            {groups.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {groups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    data-selected={group === activeGroup}
                    onClick={() =>
                      setActiveGroups((current) => ({ ...current, [optionIndex]: group }))
                    }
                    className="storefront-chip px-3 py-1.5 text-xs font-semibold"
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {visibleValues.map((value) => {
                const reachable = isReachable(variants, selection.values, optionIndex, value.value);
                return (
                  <button
                    key={value.id}
                    type="button"
                    disabled={!reachable}
                    data-selected={selection.values[optionIndex] === value.value}
                    data-disabled={!reachable}
                    onClick={() => select(optionIndex, value.value)}
                    className="storefront-chip px-3.5 py-2 text-sm"
                  >
                    {value.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

export function initialSelection(
  options: ProductOptionDto[],
  variants: ProductVariantDto[],
): VariantSelection {
  if (options.length === 0) {
    const only = variants.find((variant) => variant.enabled) ?? variants[0] ?? null;
    return { values: [], variant: only };
  }

  // Pre-select the first purchasable combination so the page is never in a
  // "nothing chosen" state the buyer has to resolve themselves.
  const first = variants.find((variant) => variant.enabled) ?? variants[0];
  if (!first) return { values: options.map(() => null), variant: null };

  return { values: [...first.optionValues], variant: first };
}
