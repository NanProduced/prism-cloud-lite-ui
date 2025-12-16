import { useMemo, useState, type ReactNode } from 'react';
import { FilePlus2, Image as ImageIcon, Layers, Plus, Trash2, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { VsnPage, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';

export function EditorLeftPanel({
  pages,
  regions,
  materials,
  selection,
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
  onSelectPage: (pageIndex: number) => void;
  onSelectRegion: (regionIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onAddRegion: () => void;
  onDeleteRegion: () => void;
  onAddTextItem: () => void;
  onAddMaterialItem: (material: EditorMaterial) => void;
}) {
  const [mediaQuery, setMediaQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');

  const filteredMaterials = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase();
    return materials.filter((m) => {
      if (mediaFilter !== 'all' && m.kind !== mediaFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q);
    });
  }, [materials, mediaFilter, mediaQuery]);

  const canAddToRegion = selection.regionIndex != null;

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
            disabled={regions.length <= 1 || selection.regionIndex == null}
            title="Delete region"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[220px] pr-2">
        <div className="space-y-2">
          {regions.map((region, index) => (
            <button
              key={`${region.Name}-${index}`}
              type="button"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                selection.regionIndex === index ? 'border-primary/60 bg-accent/30' : 'hover:bg-accent/20',
              )}
              onClick={() => onSelectRegion(index)}
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="truncate font-medium">{region.Name || `Region ${index + 1}`}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {region.Rect.Width}×{region.Rect.Height} · {region.Items.Item.length} item{region.Items.Item.length === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Insert</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onAddTextItem} disabled={!canAddToRegion}>
          <TypeIcon className="h-4 w-4" />
          Text
        </Button>
      </div>
      {!canAddToRegion && (
        <p className="text-xs text-muted-foreground">
          Select a region to insert media/text.
        </p>
      )}

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3">
          <div className="space-y-2">
            <Input value={mediaQuery} onChange={(e) => setMediaQuery(e.target.value)} placeholder="Search media…" />
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
                    canAddToRegion ? 'hover:bg-accent/20' : 'opacity-60',
                  )}
                  disabled={!canAddToRegion}
                  onClick={() => onAddMaterialItem(m)}
                  title={!canAddToRegion ? 'Select a region first' : 'Add to region'}
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
                    <p className="text-xs text-muted-foreground">
                      {m.kind}
                      {m.width && m.height ? ` · ${m.width}×${m.height}` : ''}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
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
