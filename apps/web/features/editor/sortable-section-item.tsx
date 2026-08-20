'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Eye, EyeOff, GripVertical, Lock, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DraftSection } from './use-section-draft';

interface SectionItemProps {
  section: DraftSection;
  label: string;
  locked: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** Shared visual shell so locked and sortable rows look identical. */
function ItemBody({
  section,
  label,
  locked,
  selected,
  onSelect,
  onToggleVisible,
  onDuplicate,
  onDelete,
  dragHandle,
}: SectionItemProps & { dragHandle?: React.ReactNode }) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 rounded-lg border px-2 py-2 transition-colors',
        selected
          ? 'border-primary bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]'
          : 'border-border bg-card hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))]',
      )}
    >
      {dragHandle ?? (
        <span className="text-muted-foreground/50 flex size-6 items-center justify-center">
          <Lock className="size-3.5" />
        </span>
      )}

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left text-sm font-medium outline-none"
      >
        <span
          className={cn('block truncate', !section.visible && 'text-muted-foreground line-through')}
        >
          {label}
        </span>
      </button>

      {locked && (
        <Badge variant="neutral" className="px-1.5 py-0 text-[0.625rem]">
          Fixed
        </Badge>
      )}

      {!locked && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${label}`}
              className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onToggleVisible}>
              {section.visible ? <EyeOff /> : <Eye />}
              {section.visible ? 'Hide' : 'Show'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/** Header and footer: same row, no drag handle, no destructive actions. */
export function LockedSectionItem(props: SectionItemProps) {
  return <ItemBody {...props} />;
}

export function SortableSectionItem(props: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.section.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'shadow-pop z-10 opacity-90')}
    >
      <ItemBody
        {...props}
        dragHandle={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex size-6 cursor-grab items-center justify-center rounded active:cursor-grabbing"
            aria-label={`Reorder ${props.label}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}
