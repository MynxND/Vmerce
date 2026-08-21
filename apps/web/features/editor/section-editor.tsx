'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { ArrowLeft, Blocks, CheckCircle2, ChevronDown, Eye, Image as ImageIcon, Layers, Monitor, MoreVertical, Palette, Plus, Redo2, Save, Search, Settings, Smartphone, Undo2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { SECTION_LIBRARY, THEME_PRESETS, getSectionDefinition } from '@cc/shared';
import { SectionType, type StoreThemeDto, type StorefrontStoreDto } from '@cc/types';
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
import { Input } from '@/components/ui/input';
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
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useLocale, type CopyKey } from '@/lib/i18n';
import { SectionThumbnail } from './section-thumbnail';
import { PatternOutlineItem } from './pattern-outline-item';

const ADDABLE_SECTIONS = SECTION_LIBRARY.filter((definition) => !definition.locked);

interface SectionEditorProps {
  mode?: 'canvas' | 'customizer' | 'patterns';
}

export function SectionEditor({ mode = 'canvas' }: SectionEditorProps) {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>('desktop');
  const [activeTool, setActiveTool] = React.useState<'structure' | 'add' | 'theme' | 'media' | 'settings'>('add');
  const [sectionSearch, setSectionSearch] = React.useState('');
  const [sectionCategory, setSectionCategory] = React.useState<'all' | 'hero' | 'products' | 'collections'>('all');
  const [themeDraft, setThemeDraft] = React.useState<StoreThemeDto | null>(null);
  const { t, locale } = useLocale();

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

  React.useEffect(() => {
    if (themeQuery.data) setThemeDraft(themeQuery.data);
  }, [themeQuery.data]);

  const mediaQuery = useQuery({
    queryKey: storeKeys.media(storeId ?? 'none', 1),
    queryFn: () => storesApi.media(storeId!, 1, 40),
    enabled: Boolean(storeId) && activeTool === 'media',
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

  const uploadCollectionImage = useMutation({
    mutationFn: async ({ collectionId, file }: { collectionId: string; file: File }) => {
      const media = await storesApi.uploadMedia(storeId!, file);
      return collectionsApi.update(storeId!, collectionId, { imageUrl: media.url });
    },
    onSuccess: (collection) => {
      toast.success(locale === 'th' ? `อัปเดตรูป ${collection.name} แล้ว` : locale === 'ja' ? `${collection.name}の画像を更新しました` : `${collection.name} image updated`);
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all(storeId!) });
      void queryClient.invalidateQueries({ queryKey: storeKeys.media(storeId!, 1) });
    },
    onError: (error) => toast.error(errorMessage(error, locale === 'th' ? 'อัปโหลดรูปคอลเลกชันไม่สำเร็จ' : locale === 'ja' ? 'コレクション画像をアップロードできませんでした' : 'Could not upload the collection image')),
  });

  const saveTheme = useMutation({
    mutationFn: () => storesApi.updateTheme(storeId!, {
      preset: themeDraft!.preset,
      colors: themeDraft!.colors,
      typography: themeDraft!.typography,
      layout: themeDraft!.layout,
      effects: themeDraft!.effects,
      buttonStyle: themeDraft!.buttonStyle,
      colorMode: themeDraft!.colorMode,
    }),
    onSuccess: (theme) => {
      queryClient.setQueryData(storeKeys.theme(storeId!), theme);
      setThemeDraft(theme);
      toast.success('Theme saved');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save the theme')),
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
    theme: themeDraft ?? themeQuery.data!,
  };

  const usedTypes = new Set(draft.sections.map((section) => section.type));
  const productImages = (productsQuery.data?.items ?? [])
    .map((product) => product.thumbnailUrl)
    .filter((url): url is string => Boolean(url));
  const collectionImages = (collectionsQuery.data?.items ?? [])
    .map((collection) => collection.imageUrl)
    .filter((url): url is string => Boolean(url));
  const sectionCopyKey = (type: SectionType): CopyKey => {
    const keys: Record<SectionType, CopyKey> = {
      HEADER: 'header', HERO: 'hero', FEATURED_PRODUCTS: 'featuredProducts', PRODUCT_GRID: 'productGrid', COLLECTION_LIST: 'collectionList', IMAGE_BANNER: 'imageBanner', TEXT_BLOCK: 'textBlock', IMAGE_WITH_TEXT: 'imageWithText', GALLERY: 'gallery', VIDEO: 'video', SOCIAL_LINKS: 'socialLinks', NEWSLETTER: 'newsletter', MARQUEE: 'marquee', FOOTER: 'footer',
    };
    return keys[type];
  };
  const categoryTypes: Record<typeof sectionCategory, SectionType[]> = {
    all: ADDABLE_SECTIONS.map((definition) => definition.type as SectionType),
    hero: [SectionType.HERO, SectionType.IMAGE_BANNER, SectionType.IMAGE_WITH_TEXT, SectionType.TEXT_BLOCK],
    products: [SectionType.FEATURED_PRODUCTS, SectionType.PRODUCT_GRID, SectionType.NEWSLETTER],
    collections: [SectionType.COLLECTION_LIST, SectionType.GALLERY, SectionType.VIDEO, SectionType.SOCIAL_LINKS, SectionType.MARQUEE],
  };
  const normalizedSearch = sectionSearch.trim().toLocaleLowerCase();
  const filteredSections = ADDABLE_SECTIONS.filter((definition) => {
    const type = definition.type as SectionType;
    if (!categoryTypes[sectionCategory].includes(type)) return false;
    if (!normalizedSearch) return true;
    return `${t(sectionCopyKey(type))} ${definition.label} ${definition.description}`.toLocaleLowerCase().includes(normalizedSearch);
  });

  const addSectionMenu = (className?: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Plus /> {t('addSection')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t('addSection')}</DropdownMenuLabel>
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
  );

  const sectionList = (
    <>
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
    </>
  );

  const settingsPanel = draft.selected ? (
    <SectionSettingsPanel
      key={draft.selected.key}
      type={draft.selected.type}
      settings={draft.selected.settings}
      collections={collectionsQuery.data?.items ?? []}
      onChange={(settings) => draft.updateSettings(draft.selected!.key, settings)}
    />
  ) : (
    <p className="text-muted-foreground text-sm">Select a section to start editing.</p>
  );

  const selectedIsProducts = draft.selected?.type === SectionType.FEATURED_PRODUCTS || draft.selected?.type === SectionType.PRODUCT_GRID;
  const selectedIsCollections = draft.selected?.type === SectionType.COLLECTION_LIST;
  const selectedCollectionSlug = draft.selected && typeof draft.selected.settings.collectionSlug === 'string'
    ? draft.selected.settings.collectionSlug
    : null;
  const sectionDestinationActions = selectedIsProducts || selectedIsCollections ? (
    <div className="border-border mt-4 grid gap-2 border-t pt-4">
      <Button variant="outline" size="sm" asChild>
        <Link href={selectedIsProducts ? '/dashboard/products' : '/dashboard/collections'}>
          <Settings /> {t(selectedIsProducts ? 'manageProducts' : 'manageCollections')}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link
          href={selectedIsProducts
            ? `/@${previewStore.handle}/products`
            : selectedCollectionSlug
              ? `/@${previewStore.handle}/collections/${selectedCollectionSlug}`
              : `/@${previewStore.handle}`}
          target="_blank"
          rel="noreferrer"
        >
          <Eye /> {t(selectedIsProducts ? 'previewProducts' : 'previewCollection')}
        </Link>
      </Button>
    </div>
  ) : null;

  const collectionImageEditor = selectedIsCollections ? (
    <div className="border-border mt-4 space-y-3 border-t pt-4">
      <div>
        <p className="text-sm font-semibold">Collection images</p>
        <p className="text-muted-foreground mt-1 text-xs">Upload from your device and see the preview update instantly.</p>
      </div>
      <div className="space-y-2">
        {(collectionsQuery.data?.items ?? []).map((collection) => {
          const pending = uploadCollectionImage.isPending && uploadCollectionImage.variables?.collectionId === collection.id;
          return (
            <div key={collection.id} className="border-border flex items-center gap-3 rounded-lg border p-2">
              <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-md">
                {collection.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={collection.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="text-muted-foreground m-3 size-6" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{collection.name}</span>
              <label className="border-border hover:bg-muted flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium">
                <Upload className="size-3.5" /> {pending ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadCollectionImage.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadCollectionImage.mutate({ collectionId: collection.id, file });
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const preview = (
    <SectionPreview
      store={previewStore}
      collections={collectionsQuery.data?.items ?? []}
      products={productsQuery.data?.items ?? []}
      sections={draft.sections}
      viewport={viewport}
      selectedKey={draft.selectedKey}
      onSelect={draft.setSelectedKey}
      onUpdateSettings={draft.updateSettings}
      immersive={mode !== 'canvas'}
      showEditingChrome={mode === 'patterns'}
    />
  );

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

      {mode === 'canvas' && <div className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        {/* Section list */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="size-4" /> Sections
            </CardTitle>
            <CardDescription>{draft.middle.length} editable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {sectionList}
            {addSectionMenu('mt-2 w-full')}
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card className="overflow-hidden">
          <CardHeader className="border-border border-b pb-3">
            <CardTitle className="text-sm">Preview</CardTitle>
            <CardDescription>Click any section in the preview to edit it.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {preview}
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
            {settingsPanel}
            {collectionImageEditor}
          </CardContent>
        </Card>
      </div>}

      {mode === 'customizer' && (
        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-card xl:grid-cols-[330px_1fr]">
          <aside className="border-border max-h-[calc(100dvh-13rem)] overflow-y-auto border-r p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.16em]">Home page / {draft.selected ? getSectionDefinition(draft.selected.type).label : 'Section'}</p>
            <h3 className="mt-2 text-xl font-semibold">Edit {draft.selected ? getSectionDefinition(draft.selected.type).label.toLowerCase() : 'section'}</h3>
            <p className="text-muted-foreground mt-1 text-sm">Change content and appearance. The preview updates instantly.</p>
            <div className="border-border my-5 border-t" />
            {settingsPanel}
            {collectionImageEditor}
            <div className="border-border mt-5 border-t pt-5">{addSectionMenu('w-full')}</div>
          </aside>
          <main className="bg-muted/30 relative min-w-0 p-5">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Click any block to edit</span>
              <span className="text-emerald-600">● {draft.dirty ? 'Unsaved changes' : 'All changes saved'}</span>
            </div>
            {preview}
          </main>
        </div>
      )}

      {mode === 'patterns' && (
        <div className="bg-background fixed inset-0 z-[80] grid h-dvh grid-cols-[72px_300px_minmax(520px,1fr)_240px] grid-rows-[56px_1fr] overflow-hidden text-[13px]">
          <div className="border-border col-span-2 flex items-center border-b bg-card">
            <div className="border-border flex h-14 w-[72px] items-center justify-center border-r">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full"><Blocks className="size-4" /></span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard"><ArrowLeft /> {t('back')}</Link>
            </Button>
          </div>

          <div className="border-border col-span-2 flex items-center justify-between border-b bg-card px-5">
            <button type="button" className="flex items-center gap-2 font-semibold">{t('home')} <ChevronDown className="size-3.5" /></button>
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><CheckCircle2 className="size-3.5 text-emerald-500" />{draft.dirty ? t('unsaved') : t('saved')}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" aria-label="Undo"><Undo2 /></Button>
              <Button variant="outline" size="icon-sm" aria-label="Redo"><Redo2 /></Button>
              <div className="border-border flex rounded-lg border p-0.5">
                <Button variant={viewport === 'desktop' ? 'subtle' : 'ghost'} size="icon-sm" onClick={() => setViewport('desktop')} aria-label={t('desktop')}><Monitor /></Button>
                <Button variant={viewport === 'mobile' ? 'subtle' : 'ghost'} size="icon-sm" onClick={() => setViewport('mobile')} aria-label={t('mobile')}><Smartphone /></Button>
              </div>
              <LanguageSwitcher compact />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/@${previewStore.handle}`} target="_blank" rel="noreferrer"><Eye /> {t('preview')}</Link>
              </Button>
              <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}><Save /> {t('publish')}</Button>
              <Button variant="ghost" size="icon-sm" aria-label="More"><MoreVertical /></Button>
            </div>
          </div>

          <nav className="border-border row-start-2 flex flex-col items-center gap-2 border-r bg-card py-4">
            {[
              { id: 'structure' as const, icon: Blocks, label: t('structure') },
              { id: 'add' as const, icon: Plus, label: t('add') },
              { id: 'theme' as const, icon: Palette, label: t('theme') },
              { id: 'media' as const, icon: ImageIcon, label: t('media') },
              { id: 'settings' as const, icon: Settings, label: t('settings') },
            ].map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveTool(item.id)} aria-pressed={activeTool === item.id} className={`flex w-16 flex-col items-center gap-1 rounded-lg py-3 text-[11px] ${activeTool === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                <item.icon className="size-5" />{item.label}
              </button>
            ))}
          </nav>

          <aside className="border-border row-start-2 overflow-y-auto border-r bg-card p-4">
            {activeTool === 'add' && <>
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{t('addSection')}</h2><X className="text-muted-foreground size-4" /></div>
              <div className="relative mt-4"><Search className="text-muted-foreground absolute left-3 top-2.5 size-4" /><Input value={sectionSearch} onChange={(event) => setSectionSearch(event.target.value)} className="h-9 rounded-lg pl-9" placeholder={t('searchSections')} /></div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all' as const, label: t('all') },
                  { id: 'hero' as const, label: t('hero') },
                  { id: 'products' as const, label: t('products') },
                  { id: 'collections' as const, label: t('collections') },
                ].map((item) => <button key={item.id} type="button" onClick={() => setSectionCategory(item.id)} aria-pressed={sectionCategory === item.id} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${sectionCategory === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'}`}>{item.label}</button>)}
              </div>
              <div className="mt-4 space-y-4">
                {filteredSections.map((definition) => (
                  <button key={definition.type} type="button" onClick={() => draft.add(definition.type as SectionType)} className="group w-full text-left">
                    <p className="mb-1.5 text-xs font-medium">{t(sectionCopyKey(definition.type as SectionType))}</p>
                    <div className="transition-transform group-hover:scale-[1.02]">
                      <SectionThumbnail type={definition.type as SectionType} label={t(sectionCopyKey(definition.type as SectionType))} productImages={productImages} collectionImages={collectionImages} />
                    </div>
                  </button>
                ))}
                {filteredSections.length === 0 && <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">No matching sections</p>}
              </div>
            </>}

            {activeTool === 'structure' && <>
              <h2 className="text-lg font-semibold">{t('pageOutline')}</h2>
              <p className="text-muted-foreground mt-1 text-xs">{t('dragReorder')}</p>
              <div className="mt-4 space-y-2">{draft.sections.map((section, index) => <button key={section.key} type="button" onClick={() => draft.setSelectedKey(section.key)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${draft.selectedKey === section.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}><span className="text-muted-foreground text-xs tabular-nums">{String(index + 1).padStart(2, '0')}</span><span className="text-sm font-medium">{t(sectionCopyKey(section.type))}</span></button>)}</div>
            </>}

            {activeTool === 'theme' && themeDraft && <>
              <h2 className="text-lg font-semibold">{t('theme')}</h2>
              <p className="text-muted-foreground mt-1 text-xs">Changes preview instantly.</p>
              <label className="mt-5 grid gap-2 text-xs font-medium">Preset
                <select value={themeDraft.preset} onChange={(event) => { const preset = THEME_PRESETS.find((entry) => entry.preset === event.target.value); if (preset) setThemeDraft({ ...themeDraft, ...preset }); }} className="border-border h-9 rounded-lg border bg-card px-3 text-sm">
                  {THEME_PRESETS.map((preset) => <option key={preset.preset} value={preset.preset}>{preset.label}</option>)}
                </select>
              </label>
              <div className="mt-5 space-y-3">{(['primary', 'background', 'surface', 'text', 'accent'] as const).map((key) => <label key={key} className="flex items-center gap-3 text-xs font-medium capitalize"><input type="color" value={themeDraft.colors[key]} onChange={(event) => setThemeDraft({ ...themeDraft, colors: { ...themeDraft.colors, [key]: event.target.value } })} className="border-border size-9 cursor-pointer rounded border bg-transparent p-0.5" /><span className="flex-1">{key}</span><span className="font-mono text-[10px]">{themeDraft.colors[key]}</span></label>)}</div>
              <Button className="mt-6 w-full" size="sm" loading={saveTheme.isPending} onClick={() => saveTheme.mutate()}><Save /> Save theme</Button>
            </>}

            {activeTool === 'media' && <>
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{t('media')}</h2><Button variant="outline" size="sm" asChild><Link href="/dashboard/media">Manage</Link></Button></div>
              <p className="text-muted-foreground mt-1 text-xs">Choose an image to apply it to the selected image section.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">{mediaQuery.data?.items.map((media) => <button key={media.id} type="button" onClick={() => draft.selected && draft.updateSettings(draft.selected.key, { ...draft.selected.settings, imageUrl: media.url })} className="border-border relative aspect-square overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary"><Image unoptimized fill src={media.url} alt={media.alt ?? media.fileName} className="object-cover" /></button>)}</div>
              {mediaQuery.isPending && <div className="mt-4 grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="aspect-square" />)}</div>}
              {!mediaQuery.isPending && (mediaQuery.data?.items.length ?? 0) === 0 && <p className="text-muted-foreground mt-4 rounded-lg border border-dashed p-6 text-center text-sm">Your media library is empty.</p>}
            </>}

            {activeTool === 'settings' && <>
              <h2 className="text-lg font-semibold">{t('settings')}</h2>
              <p className="text-muted-foreground mt-1 text-xs">Store and workspace settings.</p>
              <div className="mt-5 grid gap-2"><Button variant="outline" className="justify-start" asChild><Link href="/dashboard/store"><Settings /> Store settings</Link></Button><Button variant="outline" className="justify-start" asChild><Link href="/dashboard/settings"><Settings /> Account settings</Link></Button><Button variant="outline" className="justify-start" asChild><Link href={`/@${previewStore.handle}`} target="_blank"><Eye /> Open storefront</Link></Button></div>
            </>}
          </aside>

          <main className="row-start-2 min-w-0 overflow-hidden bg-[#edecef] p-0">
            {preview}
          </main>

          <aside className="border-border row-start-2 overflow-y-auto border-l bg-card p-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{t('pageOutline')}</h3><X className="text-muted-foreground size-4" /></div>
            <p className="text-muted-foreground mt-1 text-xs">{t('dragReorder')}</p>
            <div className="mt-4 space-y-2">
              {draft.header && <PatternOutlineItem section={draft.header} label={t(sectionCopyKey(draft.header.type))} selected={draft.selectedKey === draft.header.key} locked onSelect={() => draft.setSelectedKey(draft.header!.key)} />}
              <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
                <SortableContext items={draft.middle.map((section) => section.key)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {draft.middle.map((section) => <PatternOutlineItem key={section.key} section={section} label={t(sectionCopyKey(section.type))} selected={draft.selectedKey === section.key} productImages={productImages} collectionImages={collectionImages} onSelect={() => draft.setSelectedKey(section.key)} />)}
                  </div>
                </SortableContext>
              </DndContext>
              {draft.footer && <PatternOutlineItem section={draft.footer} label={t(sectionCopyKey(draft.footer.type))} selected={draft.selectedKey === draft.footer.key} locked onSelect={() => draft.setSelectedKey(draft.footer!.key)} />}
            </div>
            <div className="border-border mt-5 border-t pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide">{t('selectedSection')}</p>
              {settingsPanel}
              {collectionImageEditor}
              {sectionDestinationActions}
            </div>
            <div className="sticky bottom-0 mt-4 bg-card pt-3">{addSectionMenu('w-full')}</div>
          </aside>
        </div>
      )}
    </div>
  );
}
