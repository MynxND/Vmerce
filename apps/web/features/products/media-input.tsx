'use client';

import * as React from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storesApi } from '@/features/stores/api';
import { errorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

export interface MediaField {
  url: string;
  alt: string;
}

interface MediaInputProps {
  storeId: string | null;
  media: MediaField[];
  onChange: (media: MediaField[]) => void;
  disabled?: boolean;
}

/**
 * Two ways in: upload a file (stored by the API's storage driver) or paste a URL.
 * The first image is the product thumbnail.
 */
export function MediaInput({ storeId, media, onChange, disabled }: MediaInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [url, setUrl] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !storeId) return;
    setUploading(true);
    try {
      const uploaded: MediaField[] = [];
      for (const file of Array.from(files)) {
        const result = await storesApi.uploadMedia(storeId, file);
        uploaded.push({ url: result.url, alt: '' });
      }
      onChange([...media, ...uploaded]);
    } catch (error) {
      toast.error(errorMessage(error, 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {media.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className={cn(
              'border-border bg-muted group relative aspect-square overflow-hidden rounded-lg border',
              index === 0 && 'ring-primary ring-offset-background ring-2 ring-offset-2',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} className="size-full object-cover" />
            {index === 0 && (
              <span className="bg-primary text-primary-foreground absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold">
                Cover
              </span>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label="Remove image"
              disabled={disabled}
              onClick={() => onChange(media.filter((_, i) => i !== index))}
              className="absolute right-1.5 top-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 />
            </Button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || !storeId}
          className="border-border bg-muted/40 text-muted-foreground hover:border-primary hover:text-primary flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Upload className="size-4 animate-pulse" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="…or paste an image URL"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !url.trim()}
          onClick={() => {
            onChange([...media, { url: url.trim(), alt: '' }]);
            setUrl('');
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
