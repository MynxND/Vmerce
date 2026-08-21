'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CollectionDto, SectionType } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/field';
import { fieldsFor, type SectionField } from './section-fields';
import { useLocale, type CopyKey } from '@/lib/i18n';

type Settings = Record<string, unknown>;

interface SectionSettingsPanelProps {
  type: SectionType;
  settings: Settings;
  collections: CollectionDto[];
  onChange: (settings: Settings) => void;
}

const NO_COLLECTION = '__none__';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Repeating {label, url} rows used by header, footer and social links. */
function RowListEditor({
  rows,
  onChange,
  firstKey,
  firstLabel,
  firstPlaceholder,
}: {
  rows: Array<Record<string, string>>;
  onChange: (rows: Array<Record<string, string>>) => void;
  firstKey: string;
  firstLabel: string;
  firstPlaceholder: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={row[firstKey] ?? ''}
            onChange={(event) =>
              onChange(
                rows.map((current, i) =>
                  i === index ? { ...current, [firstKey]: event.target.value } : current,
                ),
              )
            }
            placeholder={firstPlaceholder}
            aria-label={firstLabel}
            className="h-9"
          />
          <Input
            value={row.url ?? ''}
            onChange={(event) =>
              onChange(
                rows.map((current, i) =>
                  i === index ? { ...current, url: event.target.value } : current,
                ),
              )
            }
            placeholder="https://…"
            aria-label="URL"
            className="h-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove row"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...rows, { [firstKey]: '', url: '' }])}
      >
        <Plus /> Add
      </Button>
    </div>
  );
}

function ImageListEditor({
  images,
  onChange,
}: {
  images: Array<{ url: string; alt?: string }>;
  onChange: (images: Array<{ url: string; alt?: string }>) => void;
}) {
  const [url, setUrl] = React.useState('');

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="border-border group relative aspect-square overflow-hidden rounded-md border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt ?? ''} className="size-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label="Remove image"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Image URL"
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!url.trim()}
          onClick={() => {
            onChange([...images, { url: url.trim(), alt: '' }]);
            setUrl('');
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  settings,
  collections,
  onPatch,
}: {
  field: SectionField;
  settings: Settings;
  collections: CollectionDto[];
  onPatch: (key: string, value: unknown) => void;
}) {
  const value = settings[field.key];
  const { t } = useLocale();
  const labelKeys: Partial<Record<string, CopyKey>> = {
    Heading: 'heading', Subheading: 'subheading', 'Button label': 'buttonLabel', 'Button link': 'buttonLink', 'Text alignment': 'textAlignment', 'Background image': 'backgroundImage',
  };
  const label = labelKeys[field.label] ? t(labelKeys[field.label]!) : field.label;

  switch (field.kind) {
    case 'boolean':
      return (
        <label className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <span className="text-sm font-medium">{label}</span>
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => onPatch(field.key, checked)}
          />
        </label>
      );

    case 'textarea':
      return (
        <Field label={label} hint={field.hint}>
          <Textarea
            rows={4}
            value={asString(value)}
            placeholder={field.placeholder}
            onChange={(event) => onPatch(field.key, event.target.value)}
          />
        </Field>
      );

    case 'number':
      return (
        <Field label={label} hint={field.hint}>
          <Input
            type="number"
            min={field.min}
            max={field.max}
            value={asNumber(value, field.defaultValue ?? field.min ?? 1)}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              const clamped = Math.min(Math.max(next, field.min ?? 0), field.max ?? 999);
              onPatch(field.key, clamped);
            }}
          />
        </Field>
      );

    case 'select':
      return (
        <Field label={label} hint={field.hint}>
          <Select
            value={(typeof value === 'number' ? String(value) : asString(value)) || (field.options?.[0]?.value ?? '')}
            onValueChange={(next) => onPatch(field.key, field.key === 'headingWeight' ? Number(next) : next)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      );

    case 'collection':
      return (
        <Field label={label} hint={field.hint}>
          <Select
            value={asString(value) || NO_COLLECTION}
            onValueChange={(next) => onPatch(field.key, next === NO_COLLECTION ? null : next)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_COLLECTION}>Newest products</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.slug}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      );

    case 'image':
      return (
        <Field
          label={label}
          hint={field.hint ?? 'Paste a URL, or upload in the media library.'}
        >
          <div className="space-y-2">
            <Input
              value={asString(value)}
              placeholder="https://…"
              onChange={(event) => onPatch(field.key, event.target.value || null)}
            />
            {asString(value) && (
              <div className="border-border aspect-[16/9] overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asString(value)} alt="" className="size-full object-cover" />
              </div>
            )}
          </div>
        </Field>
      );

    case 'links':
      return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <RowListEditor
            rows={asArray<Record<string, string>>(value)}
            onChange={(rows) => onPatch(field.key, rows)}
            firstKey="label"
            firstLabel="Label"
            firstPlaceholder="About"
          />
        </div>
      );

    case 'socials':
      return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <RowListEditor
            rows={asArray<Record<string, string>>(value)}
            onChange={(rows) => onPatch(field.key, rows)}
            firstKey="platform"
            firstLabel="Platform"
            firstPlaceholder="twitch"
          />
        </div>
      );

    case 'images':
      return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <ImageListEditor
            images={asArray<{ url: string; alt?: string }>(value)}
            onChange={(images) => onPatch(field.key, images)}
          />
        </div>
      );

    case 'text':
    default:
      return (
        <Field label={label} hint={field.hint}>
          <Input
            value={asString(value)}
            placeholder={field.placeholder}
            onChange={(event) => onPatch(field.key, event.target.value)}
          />
        </Field>
      );
  }
}

export function SectionSettingsPanel({
  type,
  settings,
  collections,
  onChange,
}: SectionSettingsPanelProps) {
  const fields = fieldsFor(type);
  const patch = (key: string, value: unknown) => onChange({ ...settings, [key]: value });

  if (fields.length === 0) {
    return <p className="text-muted-foreground text-sm">This section has no settings.</p>;
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          settings={settings}
          collections={collections}
          onPatch={patch}
        />
      ))}
    </div>
  );
}
