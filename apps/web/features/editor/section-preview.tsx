'use client';

import { ShoppingBag } from 'lucide-react';
import type {
  CollectionDto,
  ProductListItemDto,
  StoreSectionDto,
  StorefrontStoreDto,
} from '@cc/types';
import { SectionType } from '@cc/types';
import { StoreSection } from '@/features/storefront/sections';
import { themeStyle } from '@/features/storefront/theme-style';
import { cn } from '@/lib/utils';
import type { DraftSection } from './use-section-draft';

interface SectionPreviewProps {
  store: StorefrontStoreDto;
  collections: CollectionDto[];
  products: ProductListItemDto[];
  sections: DraftSection[];
  viewport: 'desktop' | 'mobile';
  selectedKey: string | null;
  onSelect: (key: string) => void;
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
}: SectionPreviewProps) {
  const context = { store, collections, products };

  const header = sections.find((section) => section.type === SectionType.HEADER);
  const footer = sections.find((section) => section.type === SectionType.FOOTER);
  const body = sections.filter(
    (section) => section.type !== SectionType.HEADER && section.type !== SectionType.FOOTER,
  );

  return (
    <div className="bg-muted/40 overflow-y-auto p-4" style={{ maxHeight: 'calc(100dvh - 16rem)' }}>
      <div
        className={cn(
          'storefront mx-auto overflow-hidden rounded-xl border transition-[max-width]',
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
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid var(--store-border)' }}
            >
              <span className="truncate text-sm font-semibold">{store.name}</span>
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
            <button
              key={section.key}
              type="button"
              onClick={() => onSelect(section.key)}
              className={cn(
                'block w-full cursor-pointer text-left outline-none',
                selectedKey === section.key && 'ring-primary ring-2 ring-inset',
                // Hidden sections stay visible here, dimmed, so the creator can
                // still select and edit them.
                !section.visible && 'opacity-40',
              )}
            >
              <StoreSection section={dto} context={context} />
            </button>
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
