import { useMemo, useState, type ReactNode } from 'react';
import { FilePlus2, Image as ImageIcon, Layers, Plus, Trash2, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { VsnPage, VsnRegion } from '@/features/programs/vsn/types';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (mediaFilter !== 'all' && m.kind !== mediaFilter) return false;
      return true;
    });
  }, [materials, mediaFilter]);

  const hasSelectedRegion = selection.regionIndex != null;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Pages Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-muted-foreground">{t('programEditor.panels.left.pages')}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={onAddPage} title={t('programEditor.panels.left.addPage')}>
              <FilePlus2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={onDeletePage}
              disabled={pages.length <= 1}
              title={t('common.actions.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[160px]">
          <div className="space-y-1.5 pr-3">
            {pages.map((page, index) => (
              <button
                key={`page-${index}`}
                type="button"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-all',
                  selection.pageIndex === index && selection.regionIndex == null 
                    ? 'border-primary/50 bg-primary/5 shadow-sm' 
                    : 'border-transparent hover:bg-muted/50',
                )}
                onClick={() => onSelectPage(index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs">{t('programEditor.panels.left.pages')} {index + 1}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {(page.Regions?.Region?.length ?? 0)} {t('programEditor.panels.left.regions').toLowerCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator className="opacity-50" />

      {/* Regions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-muted-foreground">{t('programEditor.panels.left.regions')}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={onAddRegion} title={t('programEditor.panels.left.addRegion')}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={onDeleteRegion}
              disabled={selection.regionIndex == null}
              title={t('common.actions.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[180px]">
          <div className="space-y-1.5 pr-3">
            {regions.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center text-[11px] text-muted-foreground">
                {t('programEditor.problems.empty')}
              </div>
            ) : (
              regions.map((region, index) => (
                <button
                  key={`region-${index}`}
                  type="button"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left transition-all',
                    selection.regionIndex === index 
                      ? 'border-primary/50 bg-primary/5 shadow-sm' 
                      : 'border-transparent hover:bg-muted/50',
                  )}
                  onClick={() => onSelectRegion(index)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className={cn("h-3 w-3", selection.regionIndex === index ? "text-primary" : "text-muted-foreground")} />
                    <span className="truncate text-xs font-semibold">{getRegionDisplayName(region, index, t)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 font-medium pl-5">
                    <span className="tabular-nums">{region.Rect.Width}×{region.Rect.Height}</span>
                    <span>·</span>
                    <span>{region.Items.Item.length} {t('message.ui.task.export.rows')}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="opacity-50" />

      {/* Insert Section */}
      <div className="flex-1 flex flex-col min-h-0 gap-3">
        <div className="flex items-center justify-between px-1 shrink-0">
          <p className="text-xs font-bold text-muted-foreground">{t('programEditor.panels.left.materials')}</p>
          <Button variant="outline" size="sm" className="h-7 rounded-md gap-1.5 text-[11px] font-bold" onClick={onAddTextItem}>
            <TypeIcon className="h-3 w-3 text-primary" />
            {t('programEditor.panels.left.addText')}
          </Button>
        </div>

        <div className="space-y-2 px-1 shrink-0">
          <div className="relative group">
            <Input 
              value={searchQuery || ''} 
              onChange={(e) => onSearchChange?.(e.target.value)} 
              placeholder={t('programEditor.panels.left.searchMaterials')} 
              className="h-9 rounded-lg bg-muted/30 border-transparent focus:bg-background transition-colors pl-8 text-xs"
            />
            <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <div className="flex items-center gap-1">
            <FilterPill active={mediaFilter === 'all'} onClick={() => setMediaFilter('all')}>{t('common.all')}</FilterPill>
            <FilterPill active={mediaFilter === 'image'} onClick={() => setMediaFilter('image')}>{t('programEditor.items.image')}</FilterPill>
            <FilterPill active={mediaFilter === 'video'} onClick={() => setMediaFilter('video')}>{t('programEditor.items.video')}</FilterPill>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 gap-1.5 pr-3 pb-4">
            {filteredMaterials.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/10 px-4 py-10 text-center text-xs text-muted-foreground">
                {t('deviceDetails.assets.noMatch')}
              </div>
            ) : (
              filteredMaterials.map((m) => (
                <button
                  key={m.materialId}
                  type="button"
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border border-transparent bg-muted/20 p-2 text-left transition-all',
                    'hover:border-border hover:bg-card hover:shadow-sm',
                  )}
                  onClick={() => onAddMaterialItem(m)}
                  title={hasSelectedRegion ? t('programEditor.panels.left.addRegion') : t('programEditor.panels.left.addRegion')}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', m.materialId);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <div className="relative flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg bg-zinc-900 shrink-0 border border-white/5 shadow-inner">
                    {m.coverUrl ? (
                      <img src={m.coverUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    ) : m.kind === 'video' ? (
                      <VideoIcon className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-zinc-500" />
                    )}
                    
                    {/* Duration Overlay */}
                    {m.kind === 'video' && m.durationMs && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 backdrop-blur-md px-1 rounded-sm text-[8px] font-black text-white tabular-nums border border-white/10">
                        {formatDurationSimple(m.durationMs)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <p className="truncate text-xs font-bold text-foreground/90 leading-tight mb-0.5">{m.name}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 font-medium">
                      <span>{m.kind === 'video' ? t('programEditor.items.video') : t('programEditor.items.image')}</span>
                      {m.width && m.height && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">{m.width}×{m.height}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
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
        'rounded-md px-2.5 py-1 text-[10px] font-bold transition-all border',
        active 
          ? 'border-primary/20 bg-primary/10 text-primary shadow-sm' 
          : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}