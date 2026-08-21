'use client';

import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Plus, ShoppingBag } from 'lucide-react';
import type {
  CollectionDto,
  ProductListItemDto,
  StoreSectionDto,
  StorefrontStoreDto,
} from '@cc/types';
import { SectionType } from '@cc/types';
import { STOREFRONT_FONTS, getStorefrontFont, type StorefrontFontCategory } from '@cc/shared';
import { StoreSection } from '@/features/storefront/sections';
import { themeStyle } from '@/features/storefront/theme-style';
import { cn } from '@/lib/utils';
import type { DraftSection } from './use-section-draft';

const FONT_CATEGORIES: StorefrontFontCategory[] = ['Display', 'Sans', 'Serif', 'Mono', 'Thai', 'Japanese'];

interface SectionPreviewProps {
  store: StorefrontStoreDto;
  collections: CollectionDto[];
  products: ProductListItemDto[];
  sections: DraftSection[];
  viewport: 'desktop' | 'mobile';
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onUpdateSettings?: (key: string, settings: Record<string, unknown>) => void;
  immersive?: boolean;
  showEditingChrome?: boolean;
}

/**
 * Live preview built from the *actual* storefront section renderer, so what the
 * creator sees here is what visitors get. Chrome (header/footer) is drawn
 * statically rather than mounting the real components, which would fetch a cart
 * and follow links out of the editor.
 */
export function SectionPreview({
  store,
  collections,
  products,
  sections,
  viewport,
  selectedKey,
  onSelect,
  onUpdateSettings,
  immersive = false,
  showEditingChrome = false,
}: SectionPreviewProps) {
  const context = { store, collections, products };

  const header = sections.find((section) => section.type === SectionType.HEADER);
  const footer = sections.find((section) => section.type === SectionType.FOOTER);
  const body = sections.filter(
    (section) => section.type !== SectionType.HEADER && section.type !== SectionType.FOOTER,
  );

  return (
    <div
      className={cn('bg-muted/40 overflow-y-auto', immersive ? 'p-1' : 'p-4')}
      style={{ maxHeight: showEditingChrome ? 'calc(100dvh - 56px)' : immersive ? 'calc(100dvh - 15rem)' : 'calc(100dvh - 16rem)' }}
    >
      <div
        className={cn(
          'storefront mx-auto overflow-hidden border transition-[max-width]',
          immersive ? 'rounded-lg' : 'rounded-xl',
          viewport === 'mobile' ? 'max-w-[400px]' : 'max-w-full',
        )}
        style={{ ...themeStyle(store.theme), borderColor: 'var(--store-border)' }}
      >
        {header && (
          <button
            type="button"
            onClick={() => onSelect(header.key)}
            className={cn(
              'block w-full text-left outline-none',
              selectedKey === header.key && 'ring-primary ring-2 ring-inset',
            )}
          >
            <div
              className="storefront-nav-shell flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid var(--store-border)' }}
            >
              <span className="truncate text-sm font-semibold">{store.name}</span>
              {showEditingChrome && <span className="hidden items-center gap-5 text-[10px] font-semibold uppercase md:flex"><span>Shop all</span><span>Apparel</span><span>Accessories</span><span>Collections</span><span>About</span></span>}
              <span className="storefront-muted flex items-center gap-1.5 text-xs">
                <ShoppingBag className="size-4" /> 0
              </span>
            </div>
          </button>
        )}

        {body.map((section) => {
          const dto: StoreSectionDto = {
            id: section.key,
            pageId: 'preview',
            type: section.type,
            position: 0,
            visible: true,
            settings: section.settings,
          };

          return (
            <div
              key={section.key}
              onClick={(event) => {
                if (event.target instanceof Element && event.target.closest('a')) event.preventDefault();
                onSelect(section.key);
              }}
              onPointerDown={(event) => {
                const target = event.target;
                if (
                  section.type !== SectionType.HERO ||
                  !(target instanceof Element) ||
                  !target.closest('[data-hero-content]') ||
                  !onUpdateSettings
                ) return;

                event.preventDefault();
                onSelect(section.key);
                const heroButton = target.closest('[data-hero-button]');
                if (heroButton) {
                  const startClientX = event.clientX;
                  const startClientY = event.clientY;
                  const startOffsetX = typeof section.settings.buttonOffsetX === 'number' ? section.settings.buttonOffsetX : 0;
                  const startOffsetY = typeof section.settings.buttonOffsetY === 'number' ? section.settings.buttonOffsetY : 0;
                  const onMoveButton = (pointerEvent: PointerEvent) => {
                    const buttonOffsetX = Math.min(500, Math.max(-500, startOffsetX + pointerEvent.clientX - startClientX));
                    const buttonOffsetY = Math.min(500, Math.max(-500, startOffsetY + pointerEvent.clientY - startClientY));
                    onUpdateSettings(section.key, { ...section.settings, buttonOffsetX, buttonOffsetY });
                  };
                  const onUpButton = () => {
                    window.removeEventListener('pointermove', onMoveButton);
                    window.removeEventListener('pointerup', onUpButton);
                  };
                  window.addEventListener('pointermove', onMoveButton);
                  window.addEventListener('pointerup', onUpButton, { once: true });
                  return;
                }
                if (target.closest('button, input, select, textarea')) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const move = (clientX: number, clientY: number) => {
                  const contentX = Math.min(96, Math.max(4, ((clientX - bounds.left) / bounds.width) * 100));
                  const contentY = Math.min(90, Math.max(15, ((clientY - bounds.top) / bounds.height) * 100));
                  onUpdateSettings(section.key, { ...section.settings, contentX, contentY });
                };
                move(event.clientX, event.clientY);
                const onMove = (pointerEvent: PointerEvent) => move(pointerEvent.clientX, pointerEvent.clientY);
                const onUp = () => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp, { once: true });
              }}
              role="button"
              tabIndex={0}
              className={cn(
                'relative block w-full cursor-pointer text-left outline-none [&_[data-hero-content]]:cursor-grab [&_[data-hero-content]]:active:cursor-grabbing [&_[data-hero-button]]:cursor-move',
                selectedKey === section.key && 'ring-primary ring-2 ring-inset',
                // Hidden sections stay visible here, dimmed, so the creator can
                // still select and edit them.
                !section.visible && 'opacity-40',
              )}
            >
              <StoreSection section={dto} context={context} />
              {showEditingChrome && selectedKey === section.key && (
                <>
                  <span className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-[#6d36e8] px-2 py-1 text-[10px] font-semibold text-white">
                    {section.type === SectionType.HERO ? 'Heading' : section.type.replaceAll('_', ' ').toLowerCase()}
                  </span>
                  {onUpdateSettings && (
                    <div onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()} className="absolute right-3 top-12 z-30 grid w-48 max-w-[calc(100%-1.5rem)] gap-2 overflow-hidden rounded-lg border border-white/15 bg-[#181818]/95 p-3 text-xs text-white shadow-2xl">
                      <label className="grid gap-1 text-[10px] text-white/60">Style
                        <select value={getStorefrontFont(section.type === SectionType.HERO ? section.settings.headingFont : section.settings.sectionFont ?? 'Manrope').family} onChange={(event) => onUpdateSettings(section.key, { ...section.settings, [section.type === SectionType.HERO ? 'headingFont' : 'sectionFont']: event.target.value })} className="w-full min-w-0 rounded border border-white/15 bg-[#242424] px-2 py-1.5 text-xs text-white outline-none">
                          {FONT_CATEGORIES.map((category) => <optgroup key={category} label={category}>{STOREFRONT_FONTS.filter((font) => font.category === category).map((font) => <option key={font.family} value={font.family} style={{ fontFamily: `'${font.family}', ${font.fallback}` }}>{font.family}</option>)}</optgroup>)}
                        </select>
                      </label>
                      <span className="text-[10px] text-white/60">Align</span>
                      <span className="flex gap-1">
                        {[
                          { value: 'left', icon: AlignLeft },
                          { value: 'center', icon: AlignCenter },
                          { value: 'right', icon: AlignRight },
                        ].map(({ value, icon: Icon }) => <button key={value} type="button" aria-label={`Align ${value}`} onClick={() => onUpdateSettings(section.key, { ...section.settings, [section.type === SectionType.HERO ? 'alignment' : 'sectionAlignment']: value })} className={cn('rounded p-1 hover:bg-white/15', section.settings[section.type === SectionType.HERO ? 'alignment' : 'sectionAlignment'] === value && 'bg-violet-600')}><Icon className="size-4" /></button>)}
                        <AlignJustify className="m-1 size-4 text-white/35" />
                      </span>
                      <label className="grid gap-1 text-[10px] text-white/60">Color
                        <span className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-[#242424] px-2 py-1">
                          <input type="color" value={typeof section.settings[section.type === SectionType.HERO ? 'textColor' : 'sectionTextColor'] === 'string' && /^#[0-9a-f]{6}$/i.test(section.settings[section.type === SectionType.HERO ? 'textColor' : 'sectionTextColor'] as string) ? section.settings[section.type === SectionType.HERO ? 'textColor' : 'sectionTextColor'] as string : '#ffffff'} onChange={(event) => onUpdateSettings(section.key, { ...section.settings, [section.type === SectionType.HERO ? 'textColor' : 'sectionTextColor']: event.target.value })} className="size-5 shrink-0 cursor-pointer border-0 bg-transparent p-0" />
                          <span className="truncate">{typeof section.settings[section.type === SectionType.HERO ? 'textColor' : 'sectionTextColor'] === 'string' ? (section.settings[section.type === SectionType.HERO ? 'textColor' : 'sectionTextColor'] as string).toUpperCase() : '#FFFFFF'}</span>
                        </span>
                      </label>
                    </div>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 -bottom-3 z-20 flex justify-center"><span className="flex size-7 items-center justify-center rounded-full bg-[#6d36e8] text-white shadow-lg"><Plus className="size-4" /></span></span>
                </>
              )}
            </div>
          );
        })}

        {body.length === 0 && (
          <p className="storefront-muted py-24 text-center text-sm">
            No sections yet — add one from the left.
          </p>
        )}

        {footer && (
          <button
            type="button"
            onClick={() => onSelect(footer.key)}
            className={cn(
              'block w-full text-left outline-none',
              selectedKey === footer.key && 'ring-primary ring-2 ring-inset',
            )}
          >
            <div
              className="storefront-muted px-5 py-6 text-center text-xs"
              style={{ borderTop: '1px solid var(--store-border)' }}
            >
              {typeof footer.settings.text === 'string' && footer.settings.text
                ? footer.settings.text
                : `© ${new Date().getFullYear()} ${store.name}`}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
