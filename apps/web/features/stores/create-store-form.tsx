'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  CREATOR_TYPE_OPTIONS,
  createStoreSchema,
  handleSchema,
  slugify,
  type CreateStoreInput,
} from '@cc/shared';
import { CreatorType } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { storesApi } from '@/features/stores/api';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { errorMessage } from '@/lib/api-error';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

/** A creator can run several shops; this is the second-and-beyond path. */
export function CreateStoreForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveStore = useAuthStore((state) => state.setActiveStore);

  const form = useForm<CreateStoreInput>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      handle: '',
      description: '',
      creatorType: CreatorType.OTHER,
      currency: 'THB',
      country: 'TH',
    },
  });

  const handle = form.watch('handle');
  const debouncedHandle = useDebouncedValue(handle);
  const handleReady = handleSchema.safeParse(debouncedHandle).success;

  const handleQuery = useQuery({
    queryKey: ['handle-check', debouncedHandle],
    queryFn: () => storesApi.checkHandle(debouncedHandle),
    enabled: handleReady,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const store = await storesApi.create(values);
      const me = await authApi.me();
      setUser(me, me.stores);
      setActiveStore(store.id);
      toast.success(`${store.name} is ready`);
      router.replace('/dashboard');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not create the shop'));
    }
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-6" noValidate>
      <PageHeader title="New shop" description="Run a second storefront under the same account." />

      <Card>
        <CardHeader>
          <CardTitle>Shop details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Shop name"
            htmlFor="name"
            error={form.formState.errors.name?.message}
            required
          >
            <Input
              id="name"
              {...form.register('name')}
              onBlur={(event) => {
                if (!form.getValues('handle')) {
                  form.setValue('handle', slugify(event.target.value).slice(0, 32));
                }
              }}
            />
          </Field>

          <Field
            label="Handle"
            htmlFor="handle"
            error={
              form.formState.errors.handle?.message ??
              (handleQuery.data && !handleQuery.data.available ? 'That handle is taken' : undefined)
            }
            required
          >
            <div className="relative">
              <Input id="handle" {...form.register('handle')} className="pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {handleReady && handleQuery.data?.available === true && (
                  <Check className="size-4 text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" />
                )}
                {handleReady && handleQuery.data?.available === false && (
                  <X className="text-destructive size-4" />
                )}
              </span>
            </div>
          </Field>

          <Field label="Creator type" htmlFor="creatorType">
            <Select
              value={form.watch('creatorType')}
              onValueChange={(value) => form.setValue('creatorType', value as CreatorType)}
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

          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={3} {...form.register('description')} />
          </Field>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={form.formState.isSubmitting}
        disabled={handleQuery.data?.available === false}
      >
        Create shop
      </Button>
    </form>
  );
}
