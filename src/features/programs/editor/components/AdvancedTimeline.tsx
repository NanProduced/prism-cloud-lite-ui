import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Layers, Trash2, Type as TypeIcon, Video as VideoIcon, ImageIcon, Zap, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { VsnItem, VsnRegion } from '@/features/programs/vsn/types';
import type { EditorMaterial, EditorSelection } from '../types';
import { getRegionDisplayName } from '../utils';

type MaterialIndex = Record<string, EditorMaterial>;

interface AdvancedTimelineProps {
  regions: VsnRegion[];
  selection: EditorSelection;
  materialIndex: MaterialIndex;
  currentTime: number;
  playbackSpeed: number;
  onCurrentTimeChange: (time: number) => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onSelectItem: (regionIndex: number, itemIndex: number) => void;
  onSelectRegion: (regionIndex: number) => void;
  onPatchItem: (regionIndex: number, itemIndex: number, patch: Partial<VsnItem>) => void;
  onDeleteItem: (regionIndex: number, itemIndex: number) => void;
  onMoveItem: (regionIndex: number, from: number, to: number) => void;
}

const MIN_DURATION_MS = 200;
const TRACK_HEIGHT = 48;
const HEADER_HEIGHT = 36;

export function AdvancedTimeline({
  regions,
  selection,
  materialIndex,
  currentTime,
  playbackSpeed,
  onCurrentTimeChange,
  onPlaybackSpeedChange,
  onSelectItem,
  onSelectRegion,
  onPatchItem,
  onDeleteItem,
  onMoveItem,
}: AdvancedTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pxPerSec, setPxPerSec] = useState(60);
  const [draggingItem, setDraggingItem] = useState<{ rIdx: number; iIdx: number } | null>(null);

  // 处理滚轮缩放 (Ctrl + Scroll)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setPxPerSec((prev) => Math.max(10, Math.min(prev * delta, 240)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // 计算最大页面时长
  const maxPageDurationMs = useMemo(() => {
    let max = 5000;
    regions.forEach((r) => {
      const total = r.Items.Item.reduce((sum, item) => sum + (Number(item.Duration) || 0), 0);
      if (total > max) max = total;
    });
    return max;
  }, [regions]);

  const viewDurationMs = Math.max(maxPageDurationMs + 5000, 10000);
  const totalWidth = (viewDurationMs / 1000) * pxPerSec;

  const handleRulerInteraction = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const update = (clientX: number) => {
      const relativeX = clientX - rect.left + scrollRef.current!.scrollLeft;
      const time = (relativeX / pxPerSec) * 1000;
      onCurrentTimeChange(Math.max(0, Math.min(time, viewDurationMs)));
    };
    update(e.clientX);
    const onMove = (mE: MouseEvent) => update(mE.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const playheadPos = (Number(currentTime) || 0) / 1000 * pxPerSec;

  return (
    <div className="flex h-full flex-col bg-card select-none overflow-hidden">
      {/* 顶部控制栏 */}
      <div className="flex h-10 flex-none items-center justify-between border-b bg-muted/20 px-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {formatTime(currentTime)} / {formatTime(maxPageDurationMs)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-foreground/5 pl-4">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onPlaybackSpeedChange(s)}
                className={cn(
                  'px-2 py-0.5 text-[10px] font-bold rounded transition-colors',
                  playbackSpeed === s ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Minus className="h-3 w-3 text-muted-foreground" />
            <div className="relative flex items-center h-4 w-32">
              <div className="absolute w-full h-1 bg-muted rounded-full" />
              <div 
                className="absolute h-1 bg-primary rounded-full" 
                style={{ width: `${((pxPerSec - 10) / (240 - 10)) * 100}%` }} 
              />
              <input
                type="range"
                min="10"
                max="240"
                value={pxPerSec}
                onChange={(e) => setPxPerSec(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute h-3 w-3 bg-primary rounded-full shadow-sm pointer-events-none"
                style={{ left: `calc(${((pxPerSec - 10) / (240 - 10)) * 100}% - 6px)` }}
              />
            </div>
            <Plus className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* 左侧：轨道表头 */}
        <div className="z-30 w-36 flex-none border-r bg-card/50 backdrop-blur-sm">
          <div style={{ height: HEADER_HEIGHT }} className="border-b bg-muted/10 flex items-center px-3 justify-between">
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Tracks</span>
          </div>
          <div className="flex flex-col">
            {regions.map((region, idx) => (
              <div
                key={`h-${idx}`}
                style={{ height: TRACK_HEIGHT }}
                className={cn(
                  "flex items-center gap-2 px-3 border-b border-foreground/[0.03] transition-colors cursor-pointer",
                  selection.regionIndex === idx ? "bg-primary/5 shadow-[inset_3px_0_0_0_#3b82f6]" : "hover:bg-muted/30"
                )}
                onClick={() => onSelectRegion(idx)}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground/40 w-3 leading-none">{region.Layer || idx + 1}</span>
                    <span className="truncate text-[11px] font-semibold tracking-tight">{getRegionDisplayName(region, idx)}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 ml-4.5 mt-0.5">{region.Items.Item.length} items</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：滚动内容区 */}
        <div 
          ref={scrollRef}
          className="relative flex-1 overflow-auto bg-muted/[0.03] scrollbar-custom"
        >
          <div className="relative" style={{ width: totalWidth, minHeight: '100%' }}>
            {/* 时间轴标尺 */}
            <div 
              style={{ height: HEADER_HEIGHT }}
              className="sticky top-0 z-40 flex border-b bg-card/95 backdrop-blur-md cursor-pointer"
              onMouseDown={handleRulerInteraction}
            >
              {Array.from({ length: Math.ceil(viewDurationMs / 1000) + 1 }).map((_, i) => (
                <div key={`t-${i}`} className="relative flex-none border-l border-foreground/[0.05] h-full" style={{ width: pxPerSec }}>
                  {i % 2 === 0 ? (
                    <span className="absolute left-1 top-1 text-[9px] font-bold text-muted-foreground/80 tabular-nums">{i}s</span>
                  ) : (
                    <div className="absolute left-0 bottom-0 h-1.5 w-px bg-foreground/10" />
                  )}
                </div>
              ))}
            </div>

            <div className="relative">
              {regions.map((region, rIdx) => (
                <div 
                  key={`tr-${rIdx}`} 
                  style={{ height: TRACK_HEIGHT }}
                  className={cn(
                    "relative w-full flex items-center border-b border-foreground/[0.02] group",
                    selection.regionIndex === rIdx && "bg-primary/[0.01]"
                  )}
                >
                  <div className="absolute inset-0 flex items-center px-0.5">
                    {region.Items.Item.map((item, iIdx) => (
                      <TimelineItemBlock
                        key={`${rIdx}-${iIdx}-${item.Type}`}
                        item={item}
                        pxPerSec={pxPerSec}
                        isSelected={selection.regionIndex === rIdx && selection.itemIndex === iIdx}
                        material={resolveMaterial(materialIndex, item)}
                        onSelect={() => onSelectItem(rIdx, iIdx)}
                        onPatch={(patch) => onPatchItem(rIdx, iIdx, patch)}
                        onDelete={() => onDeleteItem(rIdx, iIdx)}
                        onDragStart={() => setDraggingItem({ rIdx, iIdx })}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggingItem && draggingItem.rIdx === rIdx && draggingItem.iIdx !== iIdx) {
                            onMoveItem(rIdx, draggingItem.iIdx, iIdx);
                            setDraggingItem({ rIdx, iIdx });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 播放指针 */}
            <div 
              className="absolute top-0 bottom-0 z-50 w-px bg-primary pointer-events-none"
              style={{ left: playheadPos }}
            >
              <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-md" />
              <div className="h-full w-px bg-primary/40" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-custom::-webkit-scrollbar { width: 8px; height: 8px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-custom::-webkit-scrollbar-thumb { 
          background: rgba(0,0,0,0.05); 
          border-radius: 20px; 
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .dark .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); background-clip: content-box; }
        .scrollbar-custom:hover::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.15); }
        .dark .scrollbar-custom:hover::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}

function TimelineItemBlock({
  item,
  pxPerSec,
  isSelected,
  material,
  onSelect,
  onPatch,
  onDelete,
  onDragStart,
  onDragOver,
}: {
  item: VsnItem;
  pxPerSec: number;
  isSelected: boolean;
  material: EditorMaterial | null;
  onSelect: () => void;
  onPatch: (patch: Partial<VsnItem>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  const duration = Number(item.Duration) || 3000;
  const width = (duration / 1000) * pxPerSec;
  const label = material?.name || (item.Type === '4' || item.Type === '5' ? item.Text : 'Item');
  const hasEffect = !!item.inEffect;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX > rect.right - 10) {
      document.body.style.cursor = 'col-resize';
      const startX = e.clientX;
      const startDur = duration;
      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaMs = ((moveEvent.clientX - startX) / pxPerSec) * 1000;
        const next = Math.max(MIN_DURATION_MS, Math.round(startDur + deltaMs));
        const patch: Partial<VsnItem> = { Duration: String(next), PlayLength: String(next) };

        // 如果是视频且拉长了，确保开启循环播放
        if (item.Type === '3' && material?.durationMs && next > material.durationMs) {
          patch.Loop = '1';
        }

        onPatch(patch);
      };
      const onUp = () => {
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      className={cn(
        "relative h-8 flex-none rounded-sm border transition-all cursor-grab active:cursor-grabbing overflow-hidden group/item mx-[1px]",
        isSelected 
          ? "z-20 border-primary/60 bg-primary/10 ring-1 ring-primary/30" 
          : "z-10 border-foreground/5 bg-muted/30 hover:bg-muted/50"
      )}
      style={{ width: Math.max(width, 10) }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex h-full w-full items-center gap-1.5 px-2 pointer-events-none">
        <ItemTypeIcon type={item.Type} className={cn("h-3 w-3", isSelected ? "text-primary" : "text-muted-foreground/70")} />
        <span className="truncate text-[10px] font-medium flex-1">{label}</span>
        {hasEffect && <Zap className="h-2.5 w-2.5 text-amber-500 fill-amber-500/20" />}
      </div>
      <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 z-30" />
      {isSelected && (
        <button
          className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 bg-destructive p-0.5 text-white z-40"
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            onDeleteItem(); 
          }}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

function ItemTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === '3') return <VideoIcon className={className} />;
  if (type === '2' || type === '6') return <ImageIcon className={className} />;
  return <TypeIcon className={className} />;
}

function resolveMaterial(materialIndex: MaterialIndex, item: VsnItem): EditorMaterial | null {
  const id = item.FileSource?.Resource_ID;
  if (!id) return null;
  return materialIndex[id] ?? null;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const f = Math.floor((ms % 1000) / 100);
  return `${s}.${f}s`;
}
