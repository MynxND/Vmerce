'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Layers, Monitor, Plus, Save, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { SECTION_LIBRARY, getSectionDefinition } from '@cc/shared';
import { SectionType, type StorefrontStoreDto } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collectionKeys, collectionsApi } from '@/features/collections/api';
import { productKeys, productsApi } from '@/features/products/api';
import { storeKeys, storesApi } from '@/features/stores/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { errorMessage } from '@/lib/api-error';
import { SectionPreview } from './section-preview';
import { SectionSettingsPanel } from './section-settings-panel';
import { LockedSectionItem, SortableSectionItem } from './sortable-section-item';
import { useSectionDraft } from './use-section-draft';

const ADDABLE_SECTIONS = SECTION_LIBRARY.filter((definition) => !definition.locked);

export function SectionEditor() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>('desktop');

  const pagesQuery = useQuery({
    queryKey: storeKeys.pages(storeId ?? 'none'),
    queryFn: () => storesApi.pages(storeId!),
    enabled: Boolean(storeId),
  });

  const homePage = pagesQuery.data?.find((page) => page.isHome) ?? pagesQuery.data?.[0];
  const draft = useSectionDraft(homePage);

  // The preview needs the same payload the storefront gets, assembled from
  // dashboard endpoints so an unpublished store still previews correctly.
  const storeQuery = useQuery({
    queryKey: storeKeys.detail(storeId ?? 'none'),
    queryFn: () => storesApi.get(storeId!),
    enabled: Boolean(storeId),
  });

  const themeQuery = useQuery({
    queryKey: storeKeys.theme(storeId ?? 'none'),
    queryFn: () => storesApi.getTheme(storeId!),
    enabled: Boolean(storeId),
  });

  const collectionsQuery = useQuery({
    queryKey: collectionKeys.list(storeId ?? 'none'),
    queryFn: () => collectionsApi.list(storeId!, { perPage: 100 }),
    enabled: Boolean(storeId),
  });

  const productsQuery = useQuery({
    queryKey: productKeys.list(storeId ?? 'none', { perPage: 12, status: 'ACTIVE' }),
    queryFn: () => productsApi.list(storeId!, { perPage: 12, status: 'ACTIVE' }),
    enabled: Boolean(storeId),
  });

  const save = useMutation({
    mutationFn: () =>
      storesApi.updatePage(storeId!, homePage!.id, {
        sections: draft.sections.map((section) => ({
          ...(section.id ? { id: section.id } : {}),
          type: section.type,
          visible: section.visible,
          settings: section.settings,
        })),
      }),
    onSuccess: (page) => {
      toast.success('Storefront layout saved');
      queryClient.setQueryData(storeKeys.pages(storeId!), (current: typeof pagesQuery.data) =>
        current?.map((entry) => (entry.id === page.id ? page : entry)),
      );
      draft.markSaved();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save the layout')),
  });

  const sensors = useSensors(
    // A small activation distance keeps a click-to-select from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) draft.reorder(String(active.id), String(over.id));
  };

  const loading = pagesQuery.isPending || storeQuery.isPending || themeQuery.isPending || !homePage;

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const previewStore: StorefrontStoreDto = {
    id: storeQuery.data!.id,
    name: storeQuery.data!.name,
    handle: storeQuery.data!.handle,
    description: storeQuery.data!.description,
    creatorType: storeQuery.data!.creatorType,
    logoUrl: storeQuery.data!.logoUrl,
    avatarUrl: storeQuery.data!.avatarUrl,
    bannerUrl: storeQuery.data!.bannerUrl,
    currency: storeQuery.data!.currency,
    socialLinks: storeQuery.data!.socialLinks,
    theme: themeQuery.data!,
  };

  const usedTypes = new Set(draft.sections.map((section) => section.type));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Layout</h2>
          <p className="text-muted-foreground text-sm">
            Drag to reorder, click a section to edit it. Changes preview instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          {draft.dirty && (
            <Button variant="ghost" onClick={draft.reset}>
              Discard
            </Button>
          )}
          <Button loading={save.isPending} disabled={!draft.dirty} onClick={() => save.mutate()}>
            <Save /> Save layout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        {/* Section list */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="size-4" /> Sections
            </CardTitle>
            <CardDescription>{draft.middle.length} editable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {draft.header && (
              <LockedSectionItem
                section={draft.header}
                label={getSectionDefinition(draft.header.type).label}
                locked
                selected={draft.selectedKey === draft.header.key}
                onSelect={() => draft.setSelectedKey(draft.header!.key)}
                onToggleVisible={() => undefined}
                onDuplicate={() => undefined}
                onDelete={() => undefined}
              />
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={draft.middle.map((section) => section.key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {draft.middle.map((section) => (
                    <SortableSectionItem
                      key={section.key}
                      section={section}
                      label={getSectionDefinition(section.type).label}
                      locked={false}
                      selected={draft.selectedKey === section.key}
                      onSelect={() => draft.setSelectedKey(section.key)}
                      onToggleVisible={() => draft.toggleVisible(section.key)}
                      onDuplicate={() => draft.duplicate(section.key)}
                      onDelete={() => draft.remove(section.key)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {draft.middle.length === 0 && (
              <p className="text-muted-foreground py-3 text-center text-sm">
                No sections between the header and footer.
              </p>
            )}

            {draft.footer && (
              <LockedSectionItem
                section={draft.footer}
                label={getSectionDefinition(draft.footer.type).label}
                locked
                selected={draft.selectedKey === draft.footer.key}
                onSelect={() => draft.setSelectedKey(draft.footer!.key)}
                onToggleVisible={() => undefined}
                onDuplicate={() => undefined}
                onDelete={() => undefined}
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  <Plus /> Add section
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Section types</DropdownMenuLabel>
                {ADDABLE_SECTIONS.map((definition) => (
                  <DropdownMenuItem
                    key={definition.type}
                    onSelect={() => draft.add(definition.type as SectionType)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{definition.label}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {definition.description}
                      </span>
                    </span>
                    {usedTypes.has(definition.type as SectionType) && (
                      <span className="text-muted-foreground shrink-0 text-[0.625rem]">in use</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card className="overflow-hidden">
          <CardHeader className="border-border border-b pb-3">
            <CardTitle className="text-sm">Preview</CardTitle>
            <CardDescription>Click any section in the preview to edit it.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SectionPreview
              store={previewStore}
              collections={collectionsQuery.data?.items ?? []}
              products={productsQuery.data?.items ?? []}
              sections={draft.sections}
              viewport={viewport}
              selectedKey={draft.selectedKey}
              onSelect={draft.setSelectedKey}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {draft.selected ? getSectionDefinition(draft.selected.type).label : 'Settings'}
            </CardTitle>
            <CardDescription>
              {draft.selected
                ? getSectionDefinition(draft.selected.type).description
                : 'Select a section to edit its settings.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {draft.selected ? (
              <SectionSettingsPanel
                key={draft.selected.key}
                type={draft.selected.type}
                settings={draft.selected.settings}
                collections={collectionsQuery.data?.items ?? []}
                onChange={(settings) => draft.updateSettings(draft.selected!.key, settings)}
              />
            ) : (
              <p className="text-muted-foreground text-sm">Nothing selected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
