import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, X, Volume2, Maximize } from 'lucide-react';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

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
    setPlaybackSpeed(1);
    const startAt = clampInt(startPageIndex, 0, Math.max(0, pages.length - 1));
    const offset = pageDurations.slice(0, startAt).reduce((acc, v) => acc + v, 0);
    setTimeMs(offset);
  }, [open, startPageIndex, pages.length, pageDurations]);

  useEffect(() => {
    if (!open || !playing) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = (now - last) * playbackSpeed;
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
  }, [open, playing, totalDurationMs, playbackSpeed]);

  useEffect(() => {
    if (!open) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWrapperSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [open]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 2500);
  };

  const scale = useMemo(() => {
    if (!programWidth || !programHeight || wrapperSize.width <= 0) return 1;
    return Math.min((wrapperSize.width - 48) / programWidth, (wrapperSize.height - 120) / programHeight);
  }, [programHeight, programWidth, wrapperSize]);

  const { pageIndex, pageTimeMs } = useMemo(() => {
    if (pages.length === 0 || totalDurationMs <= 0) return { pageIndex: 0, pageTimeMs: 0 };
    const t = clampInt(Math.round(timeMs), 0, totalDurationMs);
    let acc = 0;
    for (let i = 0; i < pageDurations.length; i++) {
      const d = pageDurations[i] ?? 0;
      if (t < acc + d) return { pageIndex: i, pageTimeMs: t - acc };
      acc += d;
    }
    return { pageIndex: pages.length - 1, pageTimeMs: 0 };
  }, [pageDurations, pages.length, timeMs, totalDurationMs]);

  const page = pages[pageIndex] ?? null;
  const regions = useMemo(() => (page ? getRegions(doc, pageIndex) : []), [doc, page, pageIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="h-full w-full max-w-none rounded-none border-0 bg-black p-0 overflow-hidden"
      >
        <div className="flex h-full flex-col relative group" onMouseMove={handleMouseMove}>
          {/* Header - Auto hide */}
          <div className={cn(
            "absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300",
            !showControls && "opacity-0 pointer-events-none"
          )}>
            <div className="text-white">
              <h2 className="text-lg font-medium">{(doc?.Programs?.Program?.Information?.Name as string) || 'Program Preview'}</h2>
              <p className="text-xs text-white/60">{programWidth}×{programHeight} • Page {pageIndex + 1}/{pages.length}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20 rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Stage Area */}
          <div ref={wrapperRef} className="flex-1 flex items-center justify-center bg-zinc-900/40 cursor-none" style={{ cursor: showControls ? 'default' : 'none' }}>
            <div className="relative shadow-2xl" style={{ width: programWidth * scale, height: programHeight * scale }}>
               <div className="absolute inset-0" style={{ background: vsnBgColorToCss(page?.BgColor ?? '0xFF000000') }} />
               {regions.map((region, idx) => {
                  const rect = parseRect(region);
                  const items = region.Items?.Item || [];
                  const activeItem = region.Name === 'sync_program' ? pickSyncItemAtTime(regions, idx, pageTimeMs) : pickItemAtTime(region, pageTimeMs);
                  
                  // 计算 itemStartTime
                  let itemStartTime = 0;
                  if (activeItem) {
                    const activeIdx = items.indexOf(activeItem);
                    if (activeIdx > 0) {
                      itemStartTime = items.slice(0, activeIdx).reduce((acc, i) => acc + (Number(i.Duration) || 0), 0);
                    }
                  }

                  return (
                    <div key={`r-${idx}-${getItemKey(activeItem)}`} className="absolute overflow-hidden" style={{
                      left: rect.x * scale, top: rect.y * scale, width: rect.w * scale, height: rect.h * scale
                    }}>
                      <PreviewRegionContent 
                        item={activeItem} 
                        materialIndex={materialIndex} 
                        playbackSpeed={playbackSpeed} 
                        isPlaying={playing}
                        currentTime={pageTimeMs}
                        itemStartTime={itemStartTime}
                      />
                    </div>
                  );
               })}
            </div>
          </div>

          {/* Google Style Player Controls */}
          <div className={cn(
            "absolute bottom-0 inset-x-0 z-50 px-6 pb-6 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300",
            !showControls && "opacity-0 pointer-events-none"
          )}>
            {/* Progress Slider */}
            <div className="relative w-full h-1 group/progress mb-4 cursor-pointer">
               <div className="absolute inset-0 bg-white/20 rounded-full" />
               <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${(timeMs / totalDurationMs) * 100}%` }} />
               <input
                  type="range"
                  min={0}
                  max={totalDurationMs}
                  value={timeMs}
                  onChange={(e) => setTimeMs(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform" 
                    style={{ left: `calc(${(timeMs / totalDurationMs) * 100}% - 6px)` }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                <Button variant="ghost" size="icon" onClick={() => setPlaying(!playing)} className="hover:bg-white/10 rounded-full h-10 w-10">
                  {playing ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}
                </Button>
                <div className="text-sm font-medium tabular-nums select-none">
                  {formatTimeMs(timeMs)} <span className="text-white/40">/</span> {formatTimeMs(totalDurationMs)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-white/10 rounded-lg p-1 mr-2">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                        playbackSpeed === s ? "bg-primary text-white shadow-sm" : "text-white/60 hover:text-white"
                      )}
                    >
                      {s === 1 ? '1x' : `${s}x`}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewRegionContent({ 
  item, 
  materialIndex, 
  playbackSpeed, 
  isPlaying,
  currentTime,
  itemStartTime
}: { 
  item: VsnItem | null; 
  materialIndex: MaterialIndex, 
  playbackSpeed: number, 
  isPlaying: boolean,
  currentTime: number,
  itemStartTime: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // 强制同步倍速
      const speed = Number.isFinite(playbackSpeed) && playbackSpeed > 0 ? playbackSpeed : 1;
      if (video.playbackRate !== speed) {
        video.playbackRate = speed;
      }

      // 同步播放状态
      if (isPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!isPlaying && !video.paused) {
        video.pause();
      }

      // 关键：同步进度
      const internalTime = (currentTime - itemStartTime) / 1000;
      if (Math.abs(video.currentTime - internalTime) > 0.3) {
        video.currentTime = Math.max(0, internalTime);
      }
    }
  }, [playbackSpeed, isPlaying, currentTime, itemStartTime]);

  if (!item) return null;

  if (item.Type === '2' || item.Type === '6') {
    const m = item.FileSource?.Resource_ID ? materialIndex[item.FileSource.Resource_ID] : null;
    return m ? <img className="h-full w-full object-cover" src={m.coverUrl || m.assetUrl} alt="" /> : null;
  }

  if (item.Type === '3') {
    const m = item.FileSource?.Resource_ID ? materialIndex[item.FileSource.Resource_ID] : null;
    if (!m?.assetUrl) return null;
    return (
      <video
        ref={videoRef}
        key={m.assetUrl}
        className="h-full w-full object-cover"
        src={m.assetUrl}
        muted
        playsInline
      />
    );
  }

  if (item.Type === '4' || item.Type === '5') {
    return (
      <div className="h-full w-full flex items-center justify-center p-2 text-center" style={{ 
        color: item.TextColor || '#fff', 
        fontSize: `${Number(item.LogFont?.lfHeight) || 32}px`,
        fontFamily: item.LogFont?.lfFaceName || 'SimHei'
      }}>
        {item.Text}
      </div>
    );
  }
  return null;
}

// 辅助函数
function computePageDurationMs(page: VsnPage): number {
  const appoint = Number(page.AppointDuration);
  const regions = page.Regions?.Region || [];
  const regionMax = Math.max(0, ...regions.map(r => (r.Items?.Item || []).reduce((acc, i) => acc + (Number(i.Duration) || 0), 0)));
  return page.LoopType === '0' ? (appoint || Math.max(1, regionMax)) : Math.max(appoint || 0, regionMax);
}

function pickItemAtTime(region: VsnRegion, timeMs: number): VsnItem | null {
  const items = region.Items?.Item || [];
  if (items.length === 0) return null;
  const total = items.reduce((acc, i) => acc + (Number(i.Duration) || 0), 0);
  if (total <= 0) return items[0];
  const t = timeMs % total;
  let acc = 0;
  for (const item of items) {
    const d = Number(item.Duration) || 0;
    if (t < acc + d) return item;
    acc += d;
  }
  return items[items.length - 1];
}

function pickSyncItemAtTime(regions: VsnRegion[], regionIndex: number, timeMs: number): VsnItem | null {
  return pickItemAtTime(regions[regionIndex], timeMs); // 简化逻辑
}

function parseRect(region: VsnRegion) {
  return {
    x: Number(region.Rect.X) || 0,
    y: Number(region.Rect.Y) || 0,
    w: Number(region.Rect.Width) || 1,
    h: Number(region.Rect.Height) || 1,
  };
}

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function formatTimeMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function getItemKey(item: VsnItem | null) {
  if (!item) return 'none';
  return `${item.Type}:${item.FileSource?.Resource_ID || item.Text || ''}`;
}