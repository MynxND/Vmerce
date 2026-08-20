'use client';

import * as React from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { defaultSettingsFor, getSectionDefinition } from '@cc/shared';
import { SectionType, type StorePageDto, type StoreSectionDto } from '@cc/types';

export interface DraftSection {
  /** Stable client-side identity — survives reordering, and new sections have one too. */
  key: string;
  /** Server id, absent for sections added in this editing session. */
  id: string | null;
  type: SectionType;
  visible: boolean;
  settings: Record<string, unknown>;
}

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `draft-${keyCounter}`;
}

function fromDto(section: StoreSectionDto): DraftSection {
  return {
    key: section.id,
    id: section.id,
    type: section.type,
    visible: section.visible,
    settings: { ...section.settings },
  };
}

/**
 * Editing state for a page's section stack.
 *
 * Header and footer are held apart from the sortable middle so the drag
 * interaction cannot produce an arrangement the API would reject — the server
 * enforces "header first, footer last", and the UI simply never offers the
 * invalid move.
 */
export function useSectionDraft(page: StorePageDto | undefined) {
  const [sections, setSections] = React.useState<DraftSection[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  const load = React.useCallback((source: StorePageDto) => {
    const next = source.sections.map(fromDto);
    setSections(next);
    setSelectedKey((current) => current ?? next.find((s) => !isLocked(s.type))?.key ?? null);
    setDirty(false);
  }, []);

  React.useEffect(() => {
    if (page) load(page);
  }, [page, load]);

  const mutate = React.useCallback((updater: (current: DraftSection[]) => DraftSection[]) => {
    setSections((current) => updater(current));
    setDirty(true);
  }, []);

  const header = sections.find((section) => section.type === SectionType.HEADER) ?? null;
  const footer = sections.find((section) => section.type === SectionType.FOOTER) ?? null;
  const middle = sections.filter(
    (section) => section.type !== SectionType.HEADER && section.type !== SectionType.FOOTER,
  );

  const reorder = (activeKey: string, overKey: string) => {
    if (activeKey === overKey) return;
    const from = middle.findIndex((section) => section.key === activeKey);
    const to = middle.findIndex((section) => section.key === overKey);
    if (from < 0 || to < 0) return;

    const reordered = arrayMove(middle, from, to);
    mutate(() => [...(header ? [header] : []), ...reordered, ...(footer ? [footer] : [])]);
  };

  const add = (type: SectionType) => {
    const section: DraftSection = {
      key: nextKey(),
      id: null,
      type,
      visible: true,
      settings: defaultSettingsFor(type),
    };
    mutate(() => [...(header ? [header] : []), ...middle, section, ...(footer ? [footer] : [])]);
    setSelectedKey(section.key);
  };

  const duplicate = (key: string) => {
    const index = middle.findIndex((section) => section.key === key);
    if (index < 0) return;
    const source = middle[index]!;
    const copy: DraftSection = {
      key: nextKey(),
      id: null,
      type: source.type,
      visible: source.visible,
      settings: structuredClone(source.settings),
    };
    const next = [...middle];
    next.splice(index + 1, 0, copy);
    mutate(() => [...(header ? [header] : []), ...next, ...(footer ? [footer] : [])]);
    setSelectedKey(copy.key);
  };

  const remove = (key: string) => {
    mutate((current) => current.filter((section) => section.key !== key));
    setSelectedKey((current) => (current === key ? null : current));
  };

  const toggleVisible = (key: string) => {
    mutate((current) =>
      current.map((section) =>
        section.key === key ? { ...section, visible: !section.visible } : section,
      ),
    );
  };

  const updateSettings = (key: string, settings: Record<string, unknown>) => {
    mutate((current) =>
      current.map((section) => (section.key === key ? { ...section, settings } : section)),
    );
  };

  const selected = sections.find((section) => section.key === selectedKey) ?? null;

  return {
    sections,
    header,
    footer,
    middle,
    selected,
    selectedKey,
    dirty,
    setSelectedKey,
    reorder,
    add,
    duplicate,
    remove,
    toggleVisible,
    updateSettings,
    reset: () => page && load(page),
    markSaved: () => setDirty(false),
  };
}

export function isLocked(type: SectionType): boolean {
  return getSectionDefinition(type).locked;
}
