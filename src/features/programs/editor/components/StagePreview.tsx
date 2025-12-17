import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Image as ImageIcon, Maximize2, Minus, Plus, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { VsnDocument, VsnItem, VsnRect, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';
import { vsnBgColorToCss } from '../utils';
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

export function StagePreview({
  doc,
  programWidth,
  programHeight,
  selection,
  materialIndex,
  onSelectRegion,
  onPatchRegionRect,
  onDropMaterial,
  toolbar,
}: {
  doc: VsnDocument | null;
  programWidth: number;
  programHeight: number;
  selection: EditorSelection;
  materialIndex: MaterialIndex;
  onSelectRegion: (regionIndex: number) => void;
  onPatchRegionRect: (pageIndex: number, regionIndex: number, patch: Partial<VsnRect>) => void;
  onDropMaterial?: (materialId: string, point: { x: number; y: number }) => void;
  toolbar?: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [interaction, setInteraction] = useState<RegionInteraction | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
  const [zoom, setZoom] = useState(1);

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

  useEffect(() => {
    if (!interaction) return;
    const minSize = 20;

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== interaction.pointerId) return;
      if (!Number.isFinite(scale) || scale <= 0) return;
      event.preventDefault();

      const dx = (event.clientX - interaction.startClientX) / scale;
      const dy = (event.clientY - interaction.startClientY) / scale;

      if (interaction.kind === 'move') {
        const nextX = clampInt(Math.round(interaction.startRect.x + dx), 0, Math.max(0, programWidth - interaction.startRect.w));
        const nextY = clampInt(Math.round(interaction.startRect.y + dy), 0, Math.max(0, programHeight - interaction.startRect.h));
        onPatchRegionRect(interaction.pageIndex, interaction.regionIndex, {
          X: String(nextX),
          Y: String(nextY),
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
  }, [interaction, onPatchRegionRect, programHeight, programWidth, scale]);

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
            className={cn('relative overflow-hidden', dragOver && 'ring-2 ring-primary/50')}
            style={{ width: stageWidth, height: stageHeight }}
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

            {regions.map((region, regionIndex) => (
              <RegionBox
                key={`${region.Name}-${regionIndex}`}
                region={region}
                regionIndex={regionIndex}
                selected={selection.regionIndex === regionIndex}
                activeItem={pickActiveItem(region, selection)}
                scale={scale}
                materialIndex={materialIndex}
                onMoveStart={(event) => {
                  if (event.button !== 0) return;
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function pickActiveItem(region: VsnRegion, selection: EditorSelection): VsnItem | null {
  const items = region.Items?.Item ?? [];
  if (!Array.isArray(items) || items.length === 0) return null;
  if (selection.itemIndex != null && selection.regionIndex != null) {
    const match = items[selection.itemIndex];
    if (match) return match as VsnItem;
  }
  return (items[0] as VsnItem) ?? null;
}

function RegionBox({
  region,
  regionIndex,
  selected,
  activeItem,
  scale,
  materialIndex,
  onMoveStart,
  onResizeStart,
}: {
  region: VsnRegion;
  regionIndex: number;
  selected: boolean;
  activeItem: VsnItem | null;
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
      title={region.Name}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <RegionContent item={activeItem} materialIndex={materialIndex} />

        <div className="pointer-events-none absolute left-1 top-1 flex max-w-[80%] items-center gap-1 rounded bg-background/75 px-1.5 py-0.5 text-[11px] text-foreground shadow-sm">
          <span className="truncate">{region.Name || `Region ${regionIndex + 1}`}</span>
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

function RegionContent({ item, materialIndex }: { item: VsnItem | null; materialIndex: Record<string, EditorMaterial> }) {
  if (!item) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        Empty
      </div>
    );
  }

  if (item.Type === '2' || item.Type === '6') {
    const materialId = item.FileSource?.Resource_ID;
    const material = materialId ? materialIndex[materialId] : undefined;
    const src = material?.coverUrl ?? material?.assetUrl ?? undefined;
    const fit = item.ReserveAS === '1' ? 'contain' : 'fill';

    return src ? (
      <img className="h-full w-full" style={{ objectFit: fit }} src={src} alt={material?.name ?? 'Image'} />
    ) : (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        {material?.name ?? 'Image'}
      </div>
    );
  }

  if (item.Type === '3') {
    const materialId = item.FileSource?.Resource_ID;
    const material = materialId ? materialIndex[materialId] : undefined;
    if (material?.assetUrl) {
      return (
        <video
          className="h-full w-full"
          style={{ objectFit: item.ReserveAS === '1' ? 'contain' : 'fill' }}
          src={material.assetUrl}
          poster={material.coverUrl}
          muted
          playsInline
          loop
          autoPlay
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
}

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
