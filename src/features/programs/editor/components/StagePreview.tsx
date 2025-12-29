import React, { useCallback, useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Grid3x3, Image as ImageIcon, Magnet, Maximize2, Minus, MousePointer2, Plus, SquareDashed, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { VsnDocument, VsnItem, VsnRect, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';
import { getRegionDisplayName, vsnBgColorToCss } from '../utils';
import { getPages, getRegions } from '../vsnOps';

type MaterialIndex = Record<string, EditorMaterial>;

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

type RegionInteraction =
  | {
      kind: 'move';
      pageIndex: number;
      regionIndex: number;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startRect: { x: number; y: number; w: number; h: number };
    }
  | {
      kind: 'resize';
      handle: ResizeHandle;
      pageIndex: number;
      regionIndex: number;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startRect: { x: number; y: number; w: number; h: number };
    };

type CreateInteraction = {
  pointerId: number;
  start: { x: number; y: number };
  current: { x: number; y: number };
};

export function StagePreview({
  doc,
  programWidth,
  programHeight,
  selection,
  materialIndex,
  currentTime = 0,
  isPlaying = false,
  playbackSpeed = 1,
  onSelectRegion,
  onPatchRegionRect,
  onDropMaterial,
  onCreateRegionRect,
  toolbar,
}: {
  doc: VsnDocument | null;
  programWidth: number;
  programHeight: number;
  selection: EditorSelection;
  materialIndex: MaterialIndex;
  currentTime?: number;
  isPlaying?: boolean;
  playbackSpeed?: number;
  onSelectRegion: (regionIndex: number) => void;
  onPatchRegionRect: (pageIndex: number, regionIndex: number, patch: Partial<VsnRect>) => void;
  onDropMaterial?: (materialId: string, point: { x: number; y: number }) => void;
  onCreateRegionRect?: (pageIndex: number, rect: { x: number; y: number; width: number; height: number }) => void;
  toolbar?: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [interaction, setInteraction] = useState<RegionInteraction | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<'select' | 'create'>('select');
  const [createInteraction, setCreateInteraction] = useState<CreateInteraction | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const gridSize = 50;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => setIsShiftPressed(e.shiftKey || e.ctrlKey);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWrapperSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitScale = useMemo(() => {
    if (!programWidth || !programHeight) return 1;
    if (wrapperSize.width <= 0 || wrapperSize.height <= 0) return 1;
    return Math.min(wrapperSize.width / programWidth, wrapperSize.height / programHeight);
  }, [programHeight, programWidth, wrapperSize.height, wrapperSize.width]);

  useEffect(() => {
    setZoomMode('fit');
  }, [programHeight, programWidth]);

  const scale = useMemo(() => {
    if (zoomMode === 'fit') return fitScale;
    return clampFloat(zoom, 0.05, 4);
  }, [fitScale, zoom, zoomMode]);

  const page = useMemo(() => getPages(doc)[selection.pageIndex] ?? null, [doc, selection.pageIndex]);
  const regions = useMemo(() => getRegions(doc, selection.pageIndex), [doc, selection.pageIndex]);

  const bg = useMemo(() => vsnBgColorToCss(page?.BgColor ?? '0xFF000000'), [page?.BgColor]);

  const stageWidth = useMemo(() => Math.max(1, Math.round(programWidth * scale)), [programWidth, scale]);
  const stageHeight = useMemo(() => Math.max(1, Math.round(programHeight * scale)), [programHeight, scale]);

  const resolveDropPoint = (event: ReactDragEvent): { x: number; y: number } | null => {
    if (!stageRef.current) return null;
    if (!Number.isFinite(scale) || scale <= 0) return null;
    const rect = stageRef.current.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    if (!Number.isFinite(relX) || !Number.isFinite(relY)) return null;
    return {
      x: Math.max(0, Math.min(programWidth, relX / scale)),
      y: Math.max(0, Math.min(programHeight, relY / scale)),
    };
  };

  const resolvePointerPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!stageRef.current) return null;
      if (!Number.isFinite(scale) || scale <= 0) return null;
      const rect = stageRef.current.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      if (!Number.isFinite(relX) || !Number.isFinite(relY)) return null;
      return {
        x: Math.max(0, Math.min(programWidth, relX / scale)),
        y: Math.max(0, Math.min(programHeight, relY / scale)),
      };
    },
    [programHeight, programWidth, scale],
  );

  useEffect(() => {
    if (!interaction) return;
    const minSize = 20;
    const snapThreshold = 6;

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== interaction.pointerId) return;
      if (!Number.isFinite(scale) || scale <= 0) return;
      event.preventDefault();

      const dx = (event.clientX - interaction.startClientX) / scale;
      const dy = (event.clientY - interaction.startClientY) / scale;

      if (interaction.kind === 'move') {
        let nextX = clampInt(Math.round(interaction.startRect.x + dx), 0, Math.max(0, programWidth - interaction.startRect.w));
        let nextY = clampInt(Math.round(interaction.startRect.y + dy), 0, Math.max(0, programHeight - interaction.startRect.h));

        if (snapEnabled) {
          const otherRegions = regions.filter((_, i) => i !== interaction.regionIndex);
          const guidesX = [0, Math.round(programWidth / 2), programWidth];
          const guidesY = [0, Math.round(programHeight / 2), programHeight];
          otherRegions.forEach(r => {
            const rx = Number(r.Rect.X) || 0;
            const ry = Number(r.Rect.Y) || 0;
            const rw = Number(r.Rect.Width) || 0;
            const rh = Number(r.Rect.Height) || 0;
            guidesX.push(rx, rx + rw, Math.round(rx + rw / 2));
            guidesY.push(ry, ry + rh, Math.round(ry + rh / 2));
          });

          // Snap left edge, center, or right edge
          const sL = snapEdge(nextX, gridSize, snapThreshold, guidesX);
          const sC = snapEdge(nextX + interaction.startRect.w / 2, gridSize, snapThreshold, guidesX) - interaction.startRect.w / 2;
          const sR = snapEdge(nextX + interaction.startRect.w, gridSize, snapThreshold, guidesX) - interaction.startRect.w;

          if (Math.abs(sL - nextX) <= snapThreshold) nextX = sL;
          else if (Math.abs(sC - nextX) <= snapThreshold) nextX = sC;
          else if (Math.abs(sR - nextX) <= snapThreshold) nextX = sR;

          const sT = snapEdge(nextY, gridSize, snapThreshold, guidesY);
          const sMid = snapEdge(nextY + interaction.startRect.h / 2, gridSize, snapThreshold, guidesY) - interaction.startRect.h / 2;
          const sB = snapEdge(nextY + interaction.startRect.h, gridSize, snapThreshold, guidesY) - interaction.startRect.h;

          if (Math.abs(sT - nextY) <= snapThreshold) nextY = sT;
          else if (Math.abs(sMid - nextY) <= snapThreshold) nextY = sMid;
          else if (Math.abs(sB - nextY) <= snapThreshold) nextY = sB;
        }
        onPatchRegionRect(interaction.pageIndex, interaction.regionIndex, {
          X: String(clampInt(Math.round(nextX), 0, Math.max(0, programWidth - interaction.startRect.w))),
          Y: String(clampInt(Math.round(nextY), 0, Math.max(0, programHeight - interaction.startRect.h))),
        });
        return;
      }

      const startLeft = interaction.startRect.x;
      const startTop = interaction.startRect.y;
      const startRight = interaction.startRect.x + interaction.startRect.w;
      const startBottom = interaction.startRect.y + interaction.startRect.h;

      let left = startLeft;
      let top = startTop;
      let right = startRight;
      let bottom = startBottom;

      if (interaction.handle.includes('e')) {
        right = clampInt(Math.round(startRight + dx), startLeft + minSize, programWidth);
      }
      if (interaction.handle.includes('s')) {
        bottom = clampInt(Math.round(startBottom + dy), startTop + minSize, programHeight);
      }
      if (interaction.handle.includes('w')) {
        left = clampInt(Math.round(startLeft + dx), 0, startRight - minSize);
      }
      if (interaction.handle.includes('n')) {
        top = clampInt(Math.round(startTop + dy), 0, startBottom - minSize);
      }

      if (isShiftPressed && interaction.startRect.w > 0 && interaction.startRect.h > 0) {
        const ratio = interaction.startRect.w / interaction.startRect.h;
        const currentW = right - left;
        const currentH = bottom - top;
        if (Math.abs(dx) > Math.abs(dy)) {
          const targetH = Math.round(currentW / ratio);
          if (interaction.handle.includes('n')) top = bottom - targetH;
          else bottom = top + targetH;
        } else {
          const targetW = Math.round(currentH * ratio);
          if (interaction.handle.includes('w')) left = right - targetW;
          else right = left + targetW;
        }
      }

      if (snapEnabled) {
        const otherRegions = regions.filter((_, i) => i !== interaction.regionIndex);
        const guidesX = [0, Math.round(programWidth / 2), programWidth];
        const guidesY = [0, Math.round(programHeight / 2), programHeight];
        
        otherRegions.forEach(r => {
          const rx = Number(r.Rect.X) || 0;
          const ry = Number(r.Rect.Y) || 0;
          const rw = Number(r.Rect.Width) || 0;
          const rh = Number(r.Rect.Height) || 0;
          guidesX.push(rx, rx + rw, Math.round(rx + rw / 2));
          guidesY.push(ry, ry + rh, Math.round(ry + rh / 2));
        });

        const snappedLeft = snapEdge(left, gridSize, snapThreshold, guidesX);
        const snappedTop = snapEdge(top, gridSize, snapThreshold, guidesY);
        const snappedRight = snapEdge(right, gridSize, snapThreshold, guidesX);
        const snappedBottom = snapEdge(bottom, gridSize, snapThreshold, guidesY);

        if (interaction.handle.includes('w')) left = clampInt(snappedLeft, 0, startRight - minSize);
        if (interaction.handle.includes('n')) top = clampInt(snappedTop, 0, startBottom - minSize);
        if (interaction.handle.includes('e')) right = clampInt(snappedRight, startLeft + minSize, programWidth);
        if (interaction.handle.includes('s')) bottom = clampInt(snappedBottom, startTop + minSize, programHeight);
      }

      onPatchRegionRect(interaction.pageIndex, interaction.regionIndex, {
        X: String(left),
        Y: String(top),
        Width: String(Math.max(minSize, right - left)),
        Height: String(Math.max(minSize, bottom - top)),
      });
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== interaction.pointerId) return;
      setInteraction(null);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gridSize, interaction, onPatchRegionRect, programHeight, programWidth, scale, snapEnabled, isShiftPressed]);

  useEffect(() => {
    if (!createInteraction) return;
    const minSize = 20;

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== createInteraction.pointerId) return;
      const point = resolvePointerPoint(event.clientX, event.clientY);
      if (!point) return;
      event.preventDefault();
      setCreateInteraction((prev) => (prev ? { ...prev, current: point } : prev));
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== createInteraction.pointerId) return;
      const start = createInteraction.start;
      const end = createInteraction.current;
      const left = Math.min(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const right = Math.max(start.x, end.x);
      const bottom = Math.max(start.y, end.y);
      const width = Math.round(right - left);
      const height = Math.round(bottom - top);

      setCreateInteraction(null);

      if (!onCreateRegionRect) return;
      if (width < minSize || height < minSize) return;

      const x = clampInt(Math.round(left), 0, Math.max(0, programWidth - width));
      const y = clampInt(Math.round(top), 0, Math.max(0, programHeight - height));

      onCreateRegionRect(selection.pageIndex, { x, y, width, height });
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [createInteraction, onCreateRegionRect, programHeight, programWidth, resolvePointerPoint, selection.pageIndex]);

  const zoomPercent = useMemo(() => Math.round(scale * 100), [scale]);

  const applyZoom = (next: number) => {
    setZoomMode('custom');
    setZoom(clampFloat(next, 0.05, 4));
  };

  const stepZoom = (dir: -1 | 1) => {
    const base = zoomMode === 'fit' ? fitScale : zoom;
    const factor = dir === 1 ? 1.1 : 1 / 1.1;
    applyZoom(base * factor);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium">Stage</p>
          <p className="text-xs text-muted-foreground">
            {programWidth}×{programHeight} · Page {selection.pageIndex + 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-7 w-7', tool === 'select' && 'bg-accent')}
              onClick={() => setTool('select')}
              title="Select & edit"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-7 w-7', tool === 'create' && 'bg-accent')}
              onClick={() => {
                if (!onCreateRegionRect) return;
                setTool((prev) => (prev === 'create' ? 'select' : 'create'));
              }}
              disabled={!onCreateRegionRect}
              title="Draw to create window"
            >
              <SquareDashed className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-7 w-7', showGrid && 'bg-accent')}
              onClick={() => setShowGrid((v) => !v)}
              title="Toggle grid"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-7 w-7', snapEnabled && 'bg-accent')}
              onClick={() => setSnapEnabled((v) => !v)}
              title="Toggle snapping"
            >
              <Magnet className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => stepZoom(-1)} title="Zoom out">
              <Minus className="h-4 w-4" />
            </Button>
            <button
              type="button"
              className="px-2 text-xs tabular-nums text-muted-foreground"
              onClick={() => {
                if (zoomMode === 'fit') applyZoom(1);
                else setZoomMode('fit');
              }}
              title={zoomMode === 'fit' ? 'Switch to 100%' : 'Fit to view'}
            >
              {zoomPercent}%
              {zoomMode === 'fit' ? ' · Fit' : ''}
            </button>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => stepZoom(1)} title="Zoom in">
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setZoomMode('fit')}
              title="Fit to view"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : <div className="text-xs text-muted-foreground">Preview</div>}
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="relative flex flex-1 select-none overflow-auto rounded-xl border bg-muted/20"
      >
        <div className="min-h-full min-w-full p-6 flex items-center justify-center">
          <div
            ref={stageRef}
            data-testid="program-stage"
            className={cn('relative overflow-hidden', dragOver && 'ring-2 ring-primary/50', tool === 'create' && 'cursor-crosshair')}
            style={{ width: stageWidth, height: stageHeight }}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              if (tool !== 'create') return;
              if (!onCreateRegionRect) return;
              const point = resolvePointerPoint(event.clientX, event.clientY);
              if (!point) return;
              event.preventDefault();
              event.stopPropagation();
              setCreateInteraction({ pointerId: event.pointerId, start: point, current: point });
            }}
            onDragEnter={(event) => {
              if (!onDropMaterial) return;
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDragOver={(event) => {
              if (!onDropMaterial) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(event) => {
              if (!onDropMaterial) return;
              event.preventDefault();
              setDragOver(false);
              const materialId = event.dataTransfer.getData('text/plain')?.trim();
              if (!materialId) return;
              const point = resolveDropPoint(event);
              if (!point) return;
              onDropMaterial(materialId, point);
            }}
          >
            <div className="absolute inset-0" style={{ background: bg }} />
            {showGrid && (
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px)',
                  backgroundSize: `${Math.max(6, Math.round(gridSize * scale))}px ${Math.max(6, Math.round(gridSize * scale))}px`,
                }}
              />
            )}

            {regions.map((region, regionIndex) => {
              const { item, startTime } = pickActiveItem(region, regionIndex, selection, currentTime, isPlaying);
              return (
                <RegionBox
                  key={`region-${regionIndex}`}
                  region={region}
                  regionIndex={regionIndex}
                  selected={selection.regionIndex === regionIndex}
                  activeItem={item}
                  itemStartTime={startTime}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  playbackSpeed={playbackSpeed}
                  scale={scale}
                  materialIndex={materialIndex}
                  onMoveStart={(event) => {
                    if (event.button !== 0) return;
                    if (tool !== 'select') return;
                    const rect = parseRect(region);
                    onSelectRegion(regionIndex);
                    event.preventDefault();
                    event.stopPropagation();
                    setInteraction({
                      kind: 'move',
                      pageIndex: selection.pageIndex,
                      regionIndex,
                      pointerId: event.pointerId,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      startRect: rect,
                    });
                  }}
                  onResizeStart={(event, handle) => {
                    if (event.button !== 0) return;
                    if (tool !== 'select') return;
                    const rect = parseRect(region);
                    onSelectRegion(regionIndex);
                    event.preventDefault();
                    event.stopPropagation();
                    setInteraction({
                      kind: 'resize',
                      handle,
                      pageIndex: selection.pageIndex,
                      regionIndex,
                      pointerId: event.pointerId,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      startRect: rect,
                    });
                  }}
                />
              );
            })}

            {createInteraction && (
              <div
                className="pointer-events-none absolute border border-primary bg-primary/10"
                style={{
                  left: Math.min(createInteraction.start.x, createInteraction.current.x) * scale,
                  top: Math.min(createInteraction.start.y, createInteraction.current.y) * scale,
                  width: Math.abs(createInteraction.current.x - createInteraction.start.x) * scale,
                  height: Math.abs(createInteraction.current.y - createInteraction.start.y) * scale,
                }}
              />
            )}

            {interaction && (
              <div 
                className="pointer-events-none absolute z-[100] rounded bg-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg"
                style={{
                  left: (interaction.kind === 'move' ? Number(regions[interaction.regionIndex].Rect.X) : interaction.startRect.x) * scale,
                  top: (interaction.kind === 'move' ? Number(regions[interaction.regionIndex].Rect.Y) : interaction.startRect.y) * scale - 28,
                }}
              >
                {(() => {
                  const r = regions[interaction.regionIndex].Rect;
                  return `${r.X}, ${r.Y} · ${r.Width}×${r.Height}`;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function pickActiveItem(
  region: VsnRegion,
  regionIndex: number,
  selection: EditorSelection,
  currentTime: number,
  isPlaying: boolean,
): { item: VsnItem | null; startTime: number } {
  const items = region.Items?.Item ?? [];
  if (!Array.isArray(items) || items.length === 0) return { item: null, startTime: 0 };

  // Calculate total duration of the track
  let trackDuration = 0;
  items.forEach(it => trackDuration += Number(it.Duration) || 0);

  // Helper to find item at specific time
  const findItemAt = (time: number) => {
    let accumulated = 0;
    const seekTime = trackDuration > 0 ? time % trackDuration : 0;
    for (let i = 0; i < items.length; i++) {
      const duration = Number(items[i].Duration) || 0;
      if (seekTime >= accumulated && seekTime < accumulated + duration) {
        return { item: items[i] as VsnItem, startTime: accumulated, index: i };
      }
      accumulated += duration;
    }
    return { item: items[0] as VsnItem, startTime: 0, index: 0 };
  };

  // If we are playing, strictly follow the playhead
  if (isPlaying) {
    return findItemAt(currentTime);
  }

  // If not playing, and we have a selection:
  if (selection.regionIndex === regionIndex && selection.itemIndex != null) {
    const selectedItem = items[selection.itemIndex] as VsnItem;
    let selectedStartTime = 0;
    for (let i = 0; i < selection.itemIndex; i++) {
      selectedStartTime += Number(items[i].Duration) || 0;
    }
    const selectedEndTime = selectedStartTime + (Number(selectedItem.Duration) || 0);

    // If the playhead (currentTime) is currently WITHIN the selected item, 
    // or very close to the start, prioritize the selected item's state.
    if (currentTime >= selectedStartTime && currentTime < selectedEndTime) {
       return { item: selectedItem, startTime: selectedStartTime };
    }
  }

  // Fallback: Default to following the playhead
  return findItemAt(currentTime);
}

function RegionBox({
  region,
  regionIndex,
  selected,
  activeItem,
  itemStartTime,
  currentTime,
  isPlaying,
  playbackSpeed,
  scale,
  materialIndex,
  onMoveStart,
  onResizeStart,
}: {
  region: VsnRegion;
  regionIndex: number;
  selected: boolean;
  activeItem: VsnItem | null;
  itemStartTime: number;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  scale: number;
  materialIndex: Record<string, EditorMaterial>;
  onMoveStart: (event: ReactPointerEvent) => void;
  onResizeStart: (event: ReactPointerEvent, handle: ResizeHandle) => void;
}) {
  const rect = region.Rect;
  const x = Number.parseFloat(rect?.X ?? '0') || 0;
  const y = Number.parseFloat(rect?.Y ?? '0') || 0;
  const w = Number.parseFloat(rect?.Width ?? '0') || 0;
  const h = Number.parseFloat(rect?.Height ?? '0') || 0;
  const borderWidth = Number.parseFloat(rect?.BorderWidth ?? '0') || 0;

  const left = Math.round(x * scale);
  const top = Math.round(y * scale);
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));

  const borderColor = rect?.BorderColor ?? (selected ? '#22c55e' : '#111827');
  const backColor = rect?.BackColor ?? null;
  const borderPx = Math.max(0, Math.round(borderWidth * scale));
  const layer = Number.parseInt(region.Layer ?? '0', 10) || 0;

  return (
    <div
      className={cn(
        'absolute flex touch-none cursor-move items-stretch justify-stretch overflow-hidden rounded-sm text-left transition-shadow',
        selected ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.8)]' : 'hover:shadow-[0_0_0_1px_rgba(148,163,184,0.55)]',
      )}
      style={{
        left,
        top,
        width,
        height,
        zIndex: layer,
        borderStyle: 'solid',
        borderColor,
        borderWidth: borderPx,
        background: backColor ?? undefined,
      }}
      onPointerDown={onMoveStart}
      title={getRegionDisplayName(region, regionIndex)}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        {activeItem ? (
          <RegionContent 
            item={activeItem} 
            materialIndex={materialIndex} 
            currentTime={currentTime} 
            itemStartTime={itemStartTime}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Empty</span>
          </div>
        )}

        <div className="pointer-events-none absolute left-1 top-1 flex max-w-[80%] items-center gap-1 rounded bg-background/75 px-1.5 py-0.5 text-[11px] text-foreground shadow-sm">
          <span className="truncate">{getRegionDisplayName(region, regionIndex)}</span>
        </div>

        {selected && (
          <>
            <ResizeHandleDot position="nw" onPointerDown={(e) => onResizeStart(e, 'nw')} />
            <ResizeHandleDot position="ne" onPointerDown={(e) => onResizeStart(e, 'ne')} />
            <ResizeHandleDot position="sw" onPointerDown={(e) => onResizeStart(e, 'sw')} />
            <ResizeHandleDot position="se" onPointerDown={(e) => onResizeStart(e, 'se')} />
          </>
        )}
      </div>
    </div>
  );
}

function ResizeHandleDot({
  position,
  onPointerDown,
}: {
  position: 'nw' | 'ne' | 'sw' | 'se';
  onPointerDown: (event: ReactPointerEvent) => void;
}) {
  const cursor =
    position === 'nw' || position === 'se' ? 'nwse-resize' : 'nesw-resize';

  const posClass =
    position === 'nw'
      ? '-left-1 -top-1'
      : position === 'ne'
        ? '-right-1 -top-1'
        : position === 'sw'
          ? '-left-1 -bottom-1'
          : '-right-1 -bottom-1';

  return (
    <div
      className={cn(
        'absolute h-2.5 w-2.5 rounded-sm border border-primary bg-background shadow-sm',
        posClass,
      )}
      style={{ cursor }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPointerDown(event);
      }}
    />
  );
}

const RegionContent = React.memo(function RegionContent({
  item,
  materialIndex,
  currentTime,
  itemStartTime,
  isPlaying,
  playbackSpeed
}: {
  item: VsnItem | null;
  materialIndex: Record<string, EditorMaterial>;
  currentTime: number;
  itemStartTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (item?.Type === '3' && video) {
      const internalTime = (currentTime - itemStartTime) / 1000;
      
      const speed = Number.isFinite(playbackSpeed) && playbackSpeed > 0 ? playbackSpeed : 1;
      if (video.playbackRate !== speed) {
        video.playbackRate = speed;
      }

      if (isPlaying) {
        if (video.paused) {
          video.play().catch(() => {});
        }
        // Sync video time if drift is > 0.3s (playing only; avoids range refetch on selection while paused)
        if (Math.abs(video.currentTime - internalTime) > 0.3) {
          video.currentTime = Math.max(0, internalTime);
        }
      } else if (!video.paused) {
        video.pause();
      }
    }
  }, [currentTime, itemStartTime, item?.Type, isPlaying, playbackSpeed]);

  if (!item) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        Empty
      </div>
    );
  }

  const materialId = item.FileSource?.Resource_ID;
  const material = materialId ? materialIndex[materialId] : undefined;

  if (item.Type === '2' || item.Type === '6') {
    const src = material?.coverUrl ?? material?.assetUrl ?? undefined;
    const fit = item.ReserveAS === '1' ? 'contain' : 'fill';

    return src ? (
      <img 
        key={materialId || src}
        className="h-full w-full" 
        style={{ objectFit: fit }} 
        src={src} 
        alt={material?.name ?? 'Image'} 
      />
    ) : (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        {material?.name ?? 'Image'}
      </div>
    );
  }

  if (item.Type === '3') {
    if (material?.assetUrl) {
      return (
        <video
          key={materialId || material.assetUrl}
          ref={videoRef}
          className="h-full w-full"
          style={{ objectFit: item.ReserveAS === '1' ? 'contain' : 'fill' }}
          src={material.assetUrl}
          poster={material.coverUrl}
          muted
          playsInline
          preload="metadata"
          loop={item.Loop === '1'}
        />
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <VideoIcon className="h-4 w-4" />
        {material?.name ?? 'Video'}
      </div>
    );
  }

  if (item.Type === '4' || item.Type === '5') {
    const fontSize = Number.parseFloat(item.LogFont?.lfHeight ?? '32') || 32;
    const fontFamily = item.LogFont?.lfFaceName ?? undefined;
    const fontWeight = item.LogFont?.lfWeight ?? undefined;
    const italic = item.LogFont?.lfItalic === '1' ? 'italic' : 'normal';
    const underline = item.LogFont?.lfUnderLine === '1' ? 'underline' : 'none';

    return (
      <div
        className="h-full w-full overflow-hidden px-2 py-1"
        style={{
          color: item.TextColor ?? '#ffffff',
          fontSize: `${Math.max(10, Math.min(96, Math.round(fontSize)))}px`,
          fontFamily,
          fontWeight,
          fontStyle: italic,
          textDecoration: underline,
          whiteSpace: item.Type === '4' ? 'nowrap' : 'pre-wrap',
        }}
      >
        {item.Text ?? ''}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <TypeIcon className="h-4 w-4" />
      Type {item.Type}
    </div>
  );
});

function parseRect(region: VsnRegion): { x: number; y: number; w: number; h: number } {
  const rect = region.Rect;
  const x = Number.parseInt(rect?.X ?? '0', 10);
  const y = Number.parseInt(rect?.Y ?? '0', 10);
  const w = Number.parseInt(rect?.Width ?? '0', 10);
  const h = Number.parseInt(rect?.Height ?? '0', 10);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    w: Number.isFinite(w) && w > 0 ? w : 1,
    h: Number.isFinite(h) && h > 0 ? h : 1,
  };
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clampFloat(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function snapEdge(value: number, grid: number, threshold: number, guides: number[]): number {
  let next = value;
  guides.forEach((g) => {
    if (Math.abs(value - g) <= threshold) next = g;
  });
  const snapped = Math.round(next / grid) * grid;
  if (Math.abs(next - snapped) <= threshold) next = snapped;
  return next;
}
