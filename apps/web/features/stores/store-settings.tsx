'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { CREATOR_TYPE_OPTIONS } from '@cc/shared';
import { CreatorType, StoreStatus } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { PageHeader } from '@/components/page-header';
import { storeKeys, storesApi } from '@/features/stores/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/features/auth/api';
import { errorMessage } from '@/lib/api-error';
import { storeUrl } from '@/lib/utils';

const SOCIAL_KEYS = ['twitch', 'youtube', 'x', 'instagram', 'tiktok', 'discord'] as const;

const settingsSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(60),
  description: z.string().trim().max(500),
  creatorType: z.nativeEnum(CreatorType),
  logoUrl: z.string().trim(),
  avatarUrl: z.string().trim(),
  bannerUrl: z.string().trim(),
  published: z.boolean(),
  socials: z.record(z.string().trim()),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function StoreSettings() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const { data: store, isPending } = useQuery({
    queryKey: storeKeys.detail(storeId ?? 'none'),
    queryFn: () => storesApi.get(storeId!),
    enabled: Boolean(storeId),
  });

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      description: '',
      creatorType: CreatorType.OTHER,
      logoUrl: '',
      avatarUrl: '',
      bannerUrl: '',
      published: true,
      socials: {},
    },
  });

  React.useEffect(() => {
    if (!store) return;
    form.reset({
      name: store.name,
      description: store.description ?? '',
      creatorType: store.creatorType,
      logoUrl: store.logoUrl ?? '',
      avatarUrl: store.avatarUrl ?? '',
      bannerUrl: store.bannerUrl ?? '',
      published: store.status === StoreStatus.ACTIVE,
      socials: store.socialLinks,
    });
  }, [store, form]);

  const save = useMutation({
    mutationFn: (values: SettingsValues) =>
      storesApi.update(storeId!, {
        name: values.name,
        description: values.description || null,
        creatorType: values.creatorType,
        logoUrl: values.logoUrl || null,
        avatarUrl: values.avatarUrl || null,
        bannerUrl: values.bannerUrl || null,
        status: values.published ? StoreStatus.ACTIVE : StoreStatus.DRAFT,
        socialLinks: Object.fromEntries(
          Object.entries(values.socials).filter(([, value]) => value.trim() !== ''),
        ),
      }),
    onSuccess: async (updated) => {
      toast.success('Store updated');
      queryClient.setQueryData(storeKeys.detail(storeId!), updated);
      // The sidebar reads name/logo from the session, so refresh it.
      const me = await authApi.me().catch(() => null);
      if (me) setUser(me, me.stores);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const onSubmit = form.handleSubmit((values) => save.mutate(values));

  if (isPending || !store) {
    return <p className="text-muted-foreground py-16 text-center text-sm">Loading store…</p>;
  }

  const socials = form.watch('socials');

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <PageHeader
        eyebrow={`@${store.handle}`}
        title="Store"
        description="Your public identity: name, branding and where people can find you."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={storeUrl(store.handle)} target="_blank" rel="noreferrer">
                <ExternalLink /> View store
              </a>
            </Button>
            <Button type="submit" loading={save.isPending}>
              <Save /> Save
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Store name"
                htmlFor="name"
                error={form.formState.errors.name?.message}
                required
              >
                <Input id="name" {...form.register('name')} />
              </Field>

              <Field
                label="Handle"
                htmlFor="handle"
                hint="Changing your handle changes your shop URL and breaks existing links."
              >
                <Input id="handle" value={store.handle} readOnly disabled />
              </Field>

              <Field
                label="Description"
                htmlFor="description"
                error={form.formState.errors.description?.message}
              >
                <Textarea id="description" rows={4} {...form.register('description')} />
              </Field>

              <Field label="Creator type" htmlFor="creatorType">
                <Select
                  value={form.watch('creatorType')}
                  onValueChange={(value) =>
                    form.setValue('creatorType', value as CreatorType, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="creatorType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social links</CardTitle>
              <CardDescription>
                Rendered by the social links section on your storefront.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_KEYS.map((key) => (
                <Field
                  key={key}
                  label={key === 'x' ? 'X / Twitter' : key}
                  htmlFor={`social-${key}`}
                >
                  <Input
                    id={`social-${key}`}
                    value={socials[key] ?? ''}
                    onChange={(event) =>
                      form.setValue(
                        'socials',
                        { ...socials, [key]: event.target.value },
                        { shouldDirty: true },
                      )
                    }
                    placeholder={`https://${key === 'x' ? 'x.com' : `${key}.com`}/yourname`}
                  />
                </Field>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium">Storefront is live</span>
                  <span className="text-muted-foreground block text-xs">
                    Unpublishing hides the shop from visitors immediately.
                  </span>
                </span>
                <Switch
                  checked={form.watch('published')}
                  onCheckedChange={(checked) =>
                    form.setValue('published', checked, { shouldDirty: true })
                  }
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Paste image URLs, or upload in the media library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Logo URL" htmlFor="logoUrl">
                <Input id="logoUrl" {...form.register('logoUrl')} placeholder="https://…" />
              </Field>
              <Field label="Avatar URL" htmlFor="avatarUrl">
                <Input id="avatarUrl" {...form.register('avatarUrl')} placeholder="https://…" />
              </Field>
              <Field label="Banner URL" htmlFor="bannerUrl">
                <Input id="bannerUrl" {...form.register('bannerUrl')} placeholder="https://…" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom domain</CardTitle>
              <CardDescription>
                Serving your shop from your own domain arrives in Phase 3.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={store.customDomain ?? ''}
                readOnly
                disabled
                placeholder="shop.yourname.com"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
