import { useMemo, useState, type ReactNode } from 'react';
import { Clock, FilePlus2, Image as ImageIcon, Layers, Plus, Trash2, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { VsnPage, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';
import { getRegionDisplayName } from '../utils';

export function EditorLeftPanel({
  pages,
  regions,
  materials,
  selection,
  searchQuery,
  onSearchChange,
  onSelectPage,
  onSelectRegion,
  onAddPage,
  onDeletePage,
  onAddRegion,
  onDeleteRegion,
  onAddTextItem,
  onAddMaterialItem,
}: {
  pages: VsnPage[];
  regions: VsnRegion[];
  materials: EditorMaterial[];
  selection: EditorSelection;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectPage: (pageIndex: number) => void;
  onSelectRegion: (regionIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onAddRegion: () => void;
  onDeleteRegion: () => void;
  onAddTextItem: () => void;
  onAddMaterialItem: (material: EditorMaterial) => void;
}) {
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (mediaFilter !== 'all' && m.kind !== mediaFilter) return false;
      return true;
    });
  }, [materials, mediaFilter]);

  const hasSelectedRegion = selection.regionIndex != null;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Structure</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onAddPage} title="Add page">
            <FilePlus2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onDeletePage}
            disabled={pages.length <= 1}
            title="Delete page"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[240px] pr-2">
        <div className="space-y-2">
          {pages.map((page, index) => (
            <button
              key={`page-${index}`}
              type="button"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                selection.pageIndex === index && selection.regionIndex == null ? 'border-primary/60 bg-accent/30' : 'hover:bg-accent/20',
              )}
              onClick={() => onSelectPage(index)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Page {index + 1}</span>
                <span className="text-xs text-muted-foreground">
                  {(page.Regions?.Region?.length ?? 0)} region{(page.Regions?.Region?.length ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Regions</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onAddRegion} title="Add region">
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onDeleteRegion}
            disabled={selection.regionIndex == null}
            title="Delete region"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[220px] pr-2">
        <div className="space-y-2">
          {regions.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Drag media onto the canvas to create your first window.
            </div>
          ) : (
            regions.map((region, index) => (
              <button
                key={`region-${index}`}
                type="button"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selection.regionIndex === index ? 'border-primary/60 bg-accent/30' : 'hover:bg-accent/20',
                )}
                onClick={() => onSelectRegion(index)}
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate font-medium">{getRegionDisplayName(region, index)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {region.Rect.Width}×{region.Rect.Height} · {region.Items.Item.length} item{region.Items.Item.length === 1 ? '' : 's'}
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Insert</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onAddTextItem}>
          <TypeIcon className="h-4 w-4" />
          Text
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {hasSelectedRegion ? 'Adds to the selected window.' : 'Creates a new window when nothing is selected.'}
      </p>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4 pr-8">
          <div className="space-y-3">
            <div className="space-y-2">
            <Input value={searchQuery || ''} onChange={(e) => onSearchChange?.(e.target.value)} placeholder="Search media…" />
            <div className="flex items-center gap-2">
              <FilterPill active={mediaFilter === 'all'} onClick={() => setMediaFilter('all')}>
                All
              </FilterPill>
              <FilterPill active={mediaFilter === 'image'} onClick={() => setMediaFilter('image')}>
                Images
              </FilterPill>
              <FilterPill active={mediaFilter === 'video'} onClick={() => setMediaFilter('video')}>
                Videos
              </FilterPill>
            </div>
          </div>

          <div className="space-y-2">
            {filteredMaterials.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No media found.
              </div>
            ) : (
              filteredMaterials.map((m) => (
                <button
                  key={m.materialId}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-colors',
                    'hover:bg-accent/20',
                  )}
                  onClick={() => onAddMaterialItem(m)}
                  title={hasSelectedRegion ? 'Add to selected window' : 'Create a new window'}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', m.materialId);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <div className="flex h-9 w-12 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {m.coverUrl ? (
                      <img src={m.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : m.kind === 'video' ? (
                      <VideoIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        {m.kind}
                      </span>
                      {m.width && m.height && (
                        <span className="text-[9px] text-muted-foreground/60">
                          {m.width}×{m.height}
                        </span>
                      )}
                      {m.kind === 'video' && m.durationMs && (
                        <span className="flex items-center gap-1 text-[9px] text-primary font-bold ml-auto bg-primary/10 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                          <Clock className="h-2 w-2" />
                          {formatDurationSimple(m.durationMs)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function formatDurationSimple(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active ? 'border-primary/50 bg-accent text-accent-foreground' : 'hover:bg-accent/20',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
