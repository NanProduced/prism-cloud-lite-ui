import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { VsnDocument, VsnItem, VsnPage, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial } from '../types';
import { vsnBgColorToCss } from '../utils';
import { getPages, getRegions } from '../vsnOps';

type MaterialIndex = Record<string, EditorMaterial>;

export function ProgramPreviewDialog({
  open,
  onOpenChange,
  doc,
  materialIndex,
  startPageIndex = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: VsnDocument | null;
  materialIndex: MaterialIndex;
  startPageIndex?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [playing, setPlaying] = useState(true);
  const [timeMs, setTimeMs] = useState(0);

  const programWidth = useMemo(() => {
    const w = Number.parseInt(doc?.Programs?.Program?.Information?.Width ?? '', 10);
    return Number.isFinite(w) && w > 0 ? w : 1920;
  }, [doc]);
  const programHeight = useMemo(() => {
    const h = Number.parseInt(doc?.Programs?.Program?.Information?.Height ?? '', 10);
    return Number.isFinite(h) && h > 0 ? h : 1080;
  }, [doc]);

  const pages = useMemo(() => getPages(doc), [doc]);
  const pageDurations = useMemo(() => pages.map((p) => computePageDurationMs(p)), [pages]);
  const totalDurationMs = useMemo(() => pageDurations.reduce((acc, v) => acc + v, 0), [pageDurations]);

  useEffect(() => {
    if (!open) return;
    setPlaying(true);
    const startAt = clampInt(startPageIndex, 0, Math.max(0, pages.length - 1));
    const offset = pageDurations.slice(0, startAt).reduce((acc, v) => acc + v, 0);
    setTimeMs(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !playing) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setTimeMs((prev) => {
        if (totalDurationMs <= 0) return 0;
        const next = prev + delta;
        return next >= totalDurationMs ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, playing, totalDurationMs]);

  useEffect(() => {
    if (!open) return;
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWrapperSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const scale = useMemo(() => {
    if (!programWidth || !programHeight) return 1;
    if (wrapperSize.width <= 0 || wrapperSize.height <= 0) return 1;
    return Math.min(wrapperSize.width / programWidth, wrapperSize.height / programHeight);
  }, [programHeight, programWidth, wrapperSize.height, wrapperSize.width]);

  const stageWidth = useMemo(() => Math.max(1, Math.round(programWidth * scale)), [programWidth, scale]);
  const stageHeight = useMemo(() => Math.max(1, Math.round(programHeight * scale)), [programHeight, scale]);

  const { pageIndex, pageTimeMs } = useMemo(() => {
    if (pages.length === 0) return { pageIndex: 0, pageTimeMs: 0 };
    if (totalDurationMs <= 0) return { pageIndex: 0, pageTimeMs: 0 };
    const t = clampInt(Math.round(timeMs), 0, Math.max(0, totalDurationMs));
    let acc = 0;
    for (let i = 0; i < pageDurations.length; i++) {
      const d = pageDurations[i] ?? 0;
      if (t < acc + d) return { pageIndex: i, pageTimeMs: t - acc };
      acc += d;
    }
    return { pageIndex: Math.max(0, pageDurations.length - 1), pageTimeMs: 0 };
  }, [pageDurations, pages.length, timeMs, totalDurationMs]);

  const page = pages[pageIndex] ?? null;
  const bg = useMemo(() => vsnBgColorToCss(page?.BgColor ?? '0xFF000000'), [page?.BgColor]);
  const regions = useMemo(() => (page ? getRegions(doc, pageIndex) : []), [doc, page, pageIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] w-[100dvw] max-w-none rounded-none border-0 bg-background p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b bg-background/80 px-4 py-2 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Preview</p>
              <p className="text-xs text-muted-foreground">
                {programWidth}×{programHeight} · Page {Math.min(pageIndex + 1, pages.length)}/{pages.length || 0}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setPlaying((p) => !p)}
                disabled={totalDurationMs <= 0}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? 'Pause' : 'Play'}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close preview">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={wrapperRef} className="relative flex-1 overflow-hidden bg-muted/10">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="relative overflow-hidden rounded-lg border bg-background shadow-sm" style={{ width: stageWidth, height: stageHeight }}>
                <div className="absolute inset-0" style={{ background: bg }} />

                {regions.map((region, regionIndex) => {
                  const rect = parseRect(region);
                  const activeItem = region.Name === 'sync_program' ? pickSyncItemAtTime(regions, regionIndex, pageTimeMs) : pickItemAtTime(region, pageTimeMs);
                  const activeKey = getItemKey(activeItem);
                  const inEffect = getInEffect(activeItem);
                  const animation = resolveInEffectAnimation(inEffect);
                  return (
                    <div
                      key={`region-${regionIndex}-${activeKey}`}
                      className={cn('absolute overflow-hidden')}
                      style={{
                        left: rect.x * scale,
                        top: rect.y * scale,
                        width: rect.w * scale,
                        height: rect.h * scale,
                      }}
                    >
                      <div
                        className="h-full w-full"
                        style={
                          animation
                            ? {
                                animation: `${animation.name} ${animation.durationMs}ms ease-out`,
                                willChange: 'opacity, transform',
                              }
                            : undefined
                        }
                      >
                        <PreviewRegionContent item={activeItem} materialIndex={materialIndex} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
          </div>

          <div className="border-t bg-background px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="text-xs tabular-nums text-muted-foreground">
                {formatTimeMs(timeMs)} / {formatTimeMs(totalDurationMs)}
              </div>
              <input
                type="range"
                className="h-2 w-full cursor-pointer accent-primary"
                min={0}
                max={Math.max(0, totalDurationMs)}
                step={100}
                value={Math.min(totalDurationMs, Math.max(0, Math.round(timeMs)))}
                onChange={(e) => setTimeMs(Number(e.target.value))}
                disabled={totalDurationMs <= 0}
              />
              <div className="text-xs text-muted-foreground">
                Page {Math.min(pageIndex + 1, pages.length)}/{pages.length || 0}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function computePageDurationMs(page: VsnPage): number {
  const appoint = toPosInt(page.AppointDuration);
  const regions = page.Regions?.Region;
  const regionMax = Array.isArray(regions) ? Math.max(0, ...regions.map((r) => sumRegionDurationMs(r))) : 0;
  if (page.LoopType === '0') return appoint ?? Math.max(1, regionMax);
  return Math.max(appoint ?? 0, regionMax);
}

function sumRegionDurationMs(region: VsnRegion): number {
  const items = region.Items?.Item;
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((acc, item) => acc + (toPosInt(item.Duration) ?? 0), 0);
}

function pickItemAtTime(region: VsnRegion, timeMs: number): VsnItem | null {
  const items = region.Items?.Item;
  if (!Array.isArray(items) || items.length === 0) return null;
  const durations = items.map((i) => Math.max(1, toPosInt(i.Duration) ?? 1000));
  const total = durations.reduce((acc, v) => acc + v, 0);
  if (total <= 0) return items[0] ?? null;
  const t = ((Math.max(0, Math.round(timeMs)) % total) + total) % total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    const d = durations[i] ?? 0;
    if (t < acc + d) return items[i] ?? null;
    acc += d;
  }
  return items[items.length - 1] ?? null;
}

function pickSyncItemAtTime(regions: VsnRegion[], regionIndex: number, timeMs: number): VsnItem | null {
  const syncRegions = regions.filter((r) => r.Name === 'sync_program');
  if (syncRegions.length === 0) return null;

  const targetRegion = regions[regionIndex];
  if (!targetRegion) return null;

  const { segmentIndexByTime } = buildSyncTimeline(syncRegions);
  const segmentIndex = segmentIndexByTime(timeMs);
  if (segmentIndex == null) return pickItemAtTime(targetRegion, timeMs);

  const items = targetRegion.Items?.Item;
  if (!Array.isArray(items) || items.length === 0) return null;
  if (segmentIndex < items.length) return (items[segmentIndex] as VsnItem) ?? null;
  return (items[items.length - 1] as VsnItem) ?? null;
}

function buildSyncTimeline(syncRegions: VsnRegion[]): { segmentIndexByTime: (timeMs: number) => number | null } {
  const perRegionItems = syncRegions.map((r) => (Array.isArray(r.Items?.Item) ? r.Items.Item : []));
  const maxLen = Math.max(0, ...perRegionItems.map((items) => items.length));
  if (maxLen === 0) return { segmentIndexByTime: () => null };

  const segmentDurations = Array.from({ length: maxLen }, (_, idx) => {
    const duration = Math.max(
      1,
      ...perRegionItems.map((items) => Math.max(0, toPosInt(items[idx]?.Duration) ?? 0)),
    );
    return duration;
  });

  const total = segmentDurations.reduce((acc, v) => acc + v, 0);
  if (total <= 0) return { segmentIndexByTime: () => 0 };

  return {
    segmentIndexByTime: (timeMs: number) => {
      const t = ((Math.max(0, Math.round(timeMs)) % total) + total) % total;
      let acc = 0;
      for (let i = 0; i < segmentDurations.length; i++) {
        const d = segmentDurations[i] ?? 0;
        if (t < acc + d) return i;
        acc += d;
      }
      return segmentDurations.length - 1;
    },
  };
}

function PreviewRegionContent({ item, materialIndex }: { item: VsnItem | null; materialIndex: MaterialIndex }) {
  if (!item) return null;

  if (item.Type === '2' || item.Type === '6') {
    const materialId = item.FileSource?.Resource_ID;
    const material = materialId ? materialIndex[materialId] : undefined;
    const src = material?.assetUrl ?? material?.coverUrl ?? undefined;
    const fit = item.ReserveAS === '1' ? 'contain' : 'fill';
    return src ? <img className="h-full w-full" style={{ objectFit: fit }} src={src} alt={material?.name ?? 'Image'} /> : null;
  }

  if (item.Type === '3') {
    const materialId = item.FileSource?.Resource_ID;
    const material = materialId ? materialIndex[materialId] : undefined;
    if (!material?.assetUrl) return null;
    return (
      <video
        key={material.assetUrl}
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

  return null;
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

function toPosInt(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  if (!/^\d+$/.test(value)) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.trunc(num);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function getItemKey(item: VsnItem | null): string {
  if (!item) return 'none';
  const base = item.Type ?? 'unknown';
  const rid = item.FileSource?.Resource_ID;
  if (rid) return `${base}:${rid}`;
  if (item.Type === '4' || item.Type === '5') return `${base}:${(item.Text ?? '').slice(0, 24)}`;
  return `${base}:${JSON.stringify(item).slice(0, 24)}`;
}

function getInEffect(item: VsnItem | null): { type: string; timeMs: number } | null {
  if (!item) return null;
  const raw = (item as unknown as { inEffect?: unknown }).inEffect;
  if (!raw || typeof raw !== 'object') return null;
  const effect = raw as { Type?: unknown; Time?: unknown };
  const type = typeof effect.Type === 'string' ? effect.Type : '0';
  const timeMs = toPosInt(typeof effect.Time === 'string' ? effect.Time : '') ?? 500;
  if (type === '0') return null;
  return { type, timeMs };
}

function resolveInEffectAnimation(effect: { type: string; timeMs: number } | null): { name: string; durationMs: number } | null {
  if (!effect) return null;
  const durationMs = clampInt(effect.timeMs, 100, 5000);
  if (effect.type === '31') return { name: 'prism-fade-in', durationMs };
  if (effect.type === '2') return { name: 'prism-wipe-left-in', durationMs };
  if (effect.type === '3') return { name: 'prism-wipe-right-in', durationMs };
  if (effect.type === '4') return { name: 'prism-wipe-up-in', durationMs };
  if (effect.type === '5') return { name: 'prism-wipe-down-in', durationMs };
  return { name: 'prism-fade-in', durationMs };
}
