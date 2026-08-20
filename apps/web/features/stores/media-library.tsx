'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { storeKeys, storesApi } from '@/features/stores/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { errorMessage } from '@/lib/api-error';

export function MediaLibrary() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data, isPending } = useQuery({
    queryKey: storeKeys.media(storeId ?? 'none', 1),
    queryFn: () => storesApi.media(storeId!),
    enabled: Boolean(storeId),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) await storesApi.uploadMedia(storeId!, file);
    },
    onSuccess: () => {
      toast.success('Uploaded');
      void queryClient.invalidateQueries({ queryKey: storeKeys.media(storeId!, 1) });
    },
    onError: (error) => toast.error(errorMessage(error, 'Upload failed')),
    onSettled: () => {
      if (inputRef.current) inputRef.current.value = '';
    },
  });

  const remove = useMutation({
    mutationFn: (mediaId: string) => storesApi.deleteMedia(storeId!, mediaId),
    onSuccess: () => {
      toast.success('Deleted');
      void queryClient.invalidateQueries({ queryKey: storeKeys.media(storeId!, 1) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media"
        description="Artwork, product photos and banners. Stored by the API's storage driver — swap in S3, R2 or Supabase without touching the schema."
        actions={
          <Button onClick={() => inputRef.current?.click()} loading={upload.isPending}>
            <Upload /> Upload
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) upload.mutate(files);
        }}
      />

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="aspect-square w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Nothing uploaded yet"
          description="Upload artwork here once and reuse it across products, banners and collections."
          action={<Button onClick={() => inputRef.current?.click()}>Upload images</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="bg-muted relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? ''} className="size-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${item.fileName}`}
                  onClick={() => remove.mutate(item.id)}
                  className="absolute right-2 top-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 />
                </Button>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-xs font-medium">{item.fileName}</p>
                <p className="text-muted-foreground text-xs">{Math.round(item.size / 1024)} KB</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
