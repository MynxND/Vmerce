'use client';

import { Check } from 'lucide-react';
import type { ThemePresetDefinition } from '@cc/shared';
import { cn } from '@/lib/utils';

interface ThemePresetCardProps {
  preset: ThemePresetDefinition;
  selected: boolean;
  onSelect: () => void;
}

/** Miniature storefront rendered with the preset's own tokens. */
export function ThemePresetCard({ preset, selected, onSelect }: ThemePresetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'bg-card group relative overflow-hidden rounded-xl border text-left transition-all',
        selected
          ? 'border-primary ring-[3px] ring-[color-mix(in_oklab,var(--primary)_16%,transparent)]'
          : 'border-border hover:border-[color-mix(in_oklab,var(--primary)_40%,var(--border))]',
      )}
    >
      <div
        className="flex h-28 flex-col justify-between p-3"
        style={{ backgroundColor: preset.colors.background, color: preset.colors.text }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="size-4 rounded-full"
            style={{ backgroundColor: preset.colors.primary }}
            aria-hidden
          />
          <span className="text-[0.6875rem] font-semibold tracking-tight">{preset.label}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-9"
              style={{
                backgroundColor: preset.colors.surface,
                border: `1px solid ${preset.colors.border}`,
                borderRadius: `${Math.min(preset.effects.radius, 10)}px`,
              }}
            />
          ))}
        </div>

        <span
          className="w-fit px-2 py-0.5 text-[0.625rem] font-semibold"
          style={{
            backgroundColor: preset.colors.primary,
            color: preset.colors.background,
            borderRadius:
              preset.buttonStyle === 'PILL'
                ? '999px'
                : preset.buttonStyle === 'SQUARE'
                  ? '2px'
                  : '8px',
          }}
          aria-hidden
        >
          Shop now
        </span>
      </div>

      <div className="border-border border-t p-3">
        <p className="text-sm font-medium">{preset.label}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{preset.description}</p>
      </div>

      {selected && (
        <span className="bg-primary text-primary-foreground absolute right-2 top-2 flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
