'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DraftSection } from './use-section-draft';
import { SectionThumbnail } from './section-thumbnail';

interface PatternOutlineItemProps {
  section: DraftSection;
  label: string;
  selected: boolean;
  locked?: boolean;
  productImages?: string[];
  collectionImages?: string[];
  onSelect: () => void;
}

export function PatternOutlineItem(props: PatternOutlineItemProps) {
  const sortable = useSortable({ id: props.section.key, disabled: props.locked });
  const style = props.locked ? undefined : {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <div ref={sortable.setNodeRef} style={style} className={cn(sortable.isDragging && 'relative z-20 opacity-80 shadow-xl')}>
      <div className={cn('rounded-lg border p-2', props.selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted')}>
        <div className="flex items-center gap-2">
          {props.locked ? <span className="text-muted-foreground flex size-4 items-center justify-center"><Lock className="size-3" /></span> : <button type="button" aria-label={`Reorder ${props.label}`} className="text-muted-foreground flex size-4 cursor-grab items-center justify-center active:cursor-grabbing" {...sortable.attributes} {...sortable.listeners}><GripVertical className="size-3.5" /></button>}
          <button type="button" onClick={props.onSelect} className="min-w-0 flex-1 truncate text-left text-xs font-medium">{props.label}</button>
        </div>
        {!props.locked && <button type="button" onClick={props.onSelect} className="mt-2 block w-full"><SectionThumbnail type={props.section.type} label={props.label} productImages={props.productImages} collectionImages={props.collectionImages} compact /></button>}
      </div>
    </div>
  );
}
