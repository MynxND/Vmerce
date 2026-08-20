'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Save, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { THEME_PRESETS, themeToCssVariables, type UpdateThemeInput } from '@cc/shared';
import type { StoreThemeDto } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Field } from '@/components/field';
import { storeKeys, storesApi } from '@/features/stores/api';
import { useActiveStoreId, useActiveStoreSummary } from '@/hooks/use-active-store';
import { errorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'mutedText', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
  { key: 'border', label: 'Border' },
] as const;

const FONT_CHOICES = ['Inter', 'Plus Jakarta Sans', 'Playfair Display', 'Space Grotesk', 'DM Sans'];

/**
 * Phase 1 ships the design side of the store editor: colours, typography, layout
 * and effects, with a live preview driven by the same CSS variables the real
 * storefront uses. Drag-and-drop section arrangement is Phase 2 — the section
 * list below is read-only and shows what the home page currently renders.
 */
export function ThemeEditor() {
  const storeId = useActiveStoreId();
  const store = useActiveStoreSummary();
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<StoreThemeDto | null>(null);
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>('desktop');

  const themeQuery = useQuery({
    queryKey: storeKeys.theme(storeId ?? 'none'),
    queryFn: () => storesApi.getTheme(storeId!),
    enabled: Boolean(storeId),
  });

  React.useEffect(() => {
    if (themeQuery.data) setDraft(themeQuery.data);
  }, [themeQuery.data]);

  const save = useMutation({
    mutationFn: (input: UpdateThemeInput) => storesApi.updateTheme(storeId!, input),
    onSuccess: (theme) => {
      toast.success('Theme saved');
      queryClient.setQueryData(storeKeys.theme(storeId!), theme);
      setDraft(theme);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (themeQuery.isPending || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const cssVars = themeToCssVariables(draft) as React.CSSProperties;

  const patch = (next: Partial<StoreThemeDto>) => setDraft({ ...draft, ...next });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Design</h2>
          <p className="text-muted-foreground text-sm">
            Colours, type, layout and effects. Everything previews instantly.
          </p>
        </div>

        <Button
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              preset: draft.preset,
              colors: draft.colors,
              typography: draft.typography,
              layout: draft.layout,
              effects: draft.effects,
              buttonStyle: draft.buttonStyle,
              colorMode: draft.colorMode,
            })
          }
        >
          <Save /> Save theme
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Live preview */}
        <Card className="overflow-hidden">
          <CardHeader className="border-border flex-row items-center justify-between border-b pb-3">
            <CardTitle>Preview</CardTitle>
            <Tabs value={viewport} onValueChange={(value) => setViewport(value as typeof viewport)}>
              <TabsList>
                <TabsTrigger value="desktop">
                  <Monitor className="size-3.5" /> Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="size-3.5" /> Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="bg-muted/40 p-5">
            <div
              className={cn(
                'storefront mx-auto overflow-hidden rounded-xl border transition-[max-width]',
                viewport === 'mobile' ? 'max-w-[380px]' : 'max-w-full',
              )}
              style={{ ...cssVars, borderColor: 'var(--store-border)' }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--store-border)' }}
              >
                <span className="text-sm font-semibold">{store?.name ?? 'Your shop'}</span>
                <span className="storefront-muted text-xs">Cart (0)</span>
              </div>

              <div className="px-5 py-10 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Season 3 merch is here</h2>
                <p className="storefront-muted mx-auto mt-2 max-w-sm text-sm">
                  Cyber Neko drops, acrylic stands and signed prints.
                </p>
                <button
                  type="button"
                  className="storefront-button mt-5 px-5 py-2.5 text-sm font-semibold"
                  disabled
                >
                  Shop now
                </button>
              </div>

              <div className="storefront-product-grid px-5 pb-8">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="storefront-surface overflow-hidden">
                    <div
                      className="aspect-square"
                      style={{ backgroundColor: 'var(--store-border)' }}
                      aria-hidden
                    />
                    <div className="p-3">
                      <p className="truncate text-sm font-medium">Product {index + 1}</p>
                      <p className="storefront-muted text-xs">฿890.00</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preset</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={draft.preset}
                onValueChange={(value) => {
                  const preset = THEME_PRESETS.find((entry) => entry.preset === value);
                  if (!preset) return;
                  // Switching preset replaces the whole token set.
                  patch({
                    preset: preset.preset,
                    colors: preset.colors,
                    typography: preset.typography,
                    layout: preset.layout,
                    effects: preset.effects,
                    buttonStyle: preset.buttonStyle,
                    colorMode: preset.colorMode,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_PRESETS.map((preset) => (
                    <SelectItem key={preset.preset} value={preset.preset}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {COLOR_FIELDS.map((entry) => (
                <div key={entry.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={entry.label}
                    value={draft.colors[entry.key]}
                    onChange={(event) =>
                      patch({ colors: { ...draft.colors, [entry.key]: event.target.value } })
                    }
                    className="border-border size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                  />
                  <Label className="min-w-0 flex-1 truncate text-xs">{entry.label}</Label>
                  <Input
                    value={draft.colors[entry.key]}
                    onChange={(event) =>
                      patch({ colors: { ...draft.colors, [entry.key]: event.target.value } })
                    }
                    className="h-8 w-24 font-mono text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Heading font" htmlFor="headingFont">
                <Select
                  value={draft.typography.headingFont}
                  onValueChange={(value) =>
                    patch({ typography: { ...draft.typography, headingFont: value } })
                  }
                >
                  <SelectTrigger id="headingFont">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_CHOICES.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Body font" htmlFor="bodyFont">
                <Select
                  value={draft.typography.bodyFont}
                  onValueChange={(value) =>
                    patch({ typography: { ...draft.typography, bodyFont: value } })
                  }
                >
                  <SelectTrigger id="bodyFont">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_CHOICES.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label={`Font scale — ${draft.typography.fontScale.toFixed(2)}×`}
                htmlFor="fontScale"
              >
                <input
                  id="fontScale"
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={draft.typography.fontScale}
                  onChange={(event) =>
                    patch({
                      typography: { ...draft.typography, fontScale: Number(event.target.value) },
                    })
                  }
                  className="w-full accent-[var(--primary)]"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout & effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label={`Content width — ${draft.layout.contentWidth}px`}
                htmlFor="contentWidth"
              >
                <input
                  id="contentWidth"
                  type="range"
                  min={720}
                  max={1600}
                  step={20}
                  value={draft.layout.contentWidth}
                  onChange={(event) =>
                    patch({ layout: { ...draft.layout, contentWidth: Number(event.target.value) } })
                  }
                  className="w-full accent-[var(--primary)]"
                />
              </Field>

              <Field label={`Product columns — ${draft.layout.productColumns}`} htmlFor="columns">
                <input
                  id="columns"
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={draft.layout.productColumns}
                  onChange={(event) =>
                    patch({
                      layout: { ...draft.layout, productColumns: Number(event.target.value) },
                    })
                  }
                  className="w-full accent-[var(--primary)]"
                />
              </Field>

              <Field label={`Corner radius — ${draft.effects.radius}px`} htmlFor="radius">
                <input
                  id="radius"
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={draft.effects.radius}
                  onChange={(event) =>
                    patch({ effects: { ...draft.effects, radius: Number(event.target.value) } })
                  }
                  className="w-full accent-[var(--primary)]"
                />
              </Field>

              <Field label="Button shape" htmlFor="buttonStyle">
                <Select
                  value={draft.buttonStyle}
                  onValueChange={(value) =>
                    patch({ buttonStyle: value as StoreThemeDto['buttonStyle'] })
                  }
                >
                  <SelectTrigger id="buttonStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUNDED">Rounded</SelectItem>
                    <SelectItem value="SQUARE">Square</SelectItem>
                    <SelectItem value="PILL">Pill</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Shadow" htmlFor="shadow">
                <Select
                  value={draft.effects.shadow}
                  onValueChange={(value) =>
                    patch({
                      effects: { ...draft.effects, shadow: value as typeof draft.effects.shadow },
                    })
                  }
                >
                  <SelectTrigger id="shadow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <label className="flex items-center justify-between">
                <span className="text-sm font-medium">Animations</span>
                <Switch
                  checked={draft.effects.animations}
                  onCheckedChange={(checked) =>
                    patch({ effects: { ...draft.effects, animations: checked } })
                  }
                />
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
