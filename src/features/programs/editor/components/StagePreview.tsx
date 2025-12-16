import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { VsnDocument, VsnItem, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';
import { vsnBgColorToCss } from '../utils';
import { getPages, getRegions } from '../vsnOps';

type MaterialIndex = Record<string, EditorMaterial>;

export function StagePreview({
  doc,
  programWidth,
  programHeight,
  selection,
  materialIndex,
  onSelectRegion,
}: {
  doc: VsnDocument | null;
  programWidth: number;
  programHeight: number;
  selection: EditorSelection;
  materialIndex: MaterialIndex;
  onSelectRegion: (regionIndex: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState(0);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWrapperWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (!programWidth) return 1;
    return wrapperWidth > 0 ? wrapperWidth / programWidth : 1;
  }, [programWidth, wrapperWidth]);

  const page = useMemo(() => getPages(doc)[selection.pageIndex] ?? null, [doc, selection.pageIndex]);
  const regions = useMemo(() => getRegions(doc, selection.pageIndex), [doc, selection.pageIndex]);

  const bg = useMemo(() => vsnBgColorToCss(page?.BgColor ?? '0xFF000000'), [page?.BgColor]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium">Stage</p>
          <p className="text-xs text-muted-foreground">
            {programWidth}×{programHeight} · Page {selection.pageIndex + 1}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">Preview</div>
      </div>

      <div
        ref={wrapperRef}
        className="relative flex-1 overflow-hidden rounded-xl border bg-muted/20"
        style={{ aspectRatio: `${programWidth} / ${programHeight}` }}
      >
        <div className="absolute inset-0" style={{ background: bg }} />

        {regions.map((region, regionIndex) => (
          <RegionBox
            key={`${region.Name}-${regionIndex}`}
            region={region}
            regionIndex={regionIndex}
            programWidth={programWidth}
            programHeight={programHeight}
            selected={selection.regionIndex === regionIndex}
            activeItem={pickActiveItem(region, selection)}
            scale={scale}
            materialIndex={materialIndex}
            onSelect={() => onSelectRegion(regionIndex)}
          />
        ))}
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
  programWidth,
  programHeight,
  selected,
  activeItem,
  scale,
  materialIndex,
  onSelect,
}: {
  region: VsnRegion;
  regionIndex: number;
  programWidth: number;
  programHeight: number;
  selected: boolean;
  activeItem: VsnItem | null;
  scale: number;
  materialIndex: Record<string, EditorMaterial>;
  onSelect: () => void;
}) {
  const rect = region.Rect;
  const x = Number.parseFloat(rect?.X ?? '0') || 0;
  const y = Number.parseFloat(rect?.Y ?? '0') || 0;
  const w = Number.parseFloat(rect?.Width ?? '0') || 0;
  const h = Number.parseFloat(rect?.Height ?? '0') || 0;
  const borderWidth = Number.parseFloat(rect?.BorderWidth ?? '0') || 0;

  const left = `${(x / programWidth) * 100}%`;
  const top = `${(y / programHeight) * 100}%`;
  const width = `${(w / programWidth) * 100}%`;
  const height = `${(h / programHeight) * 100}%`;

  const borderColor = rect?.BorderColor ?? (selected ? '#22c55e' : '#111827');
  const backColor = rect?.BackColor ?? null;
  const borderPx = Math.max(1, Math.round(borderWidth * scale));

  return (
    <button
      type="button"
      className={cn(
        'absolute flex cursor-pointer items-stretch justify-stretch overflow-hidden rounded-sm text-left transition-shadow',
        selected ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.8)]' : 'hover:shadow-[0_0_0_1px_rgba(148,163,184,0.55)]',
      )}
      style={{
        left,
        top,
        width,
        height,
        borderStyle: 'solid',
        borderColor,
        borderWidth: borderPx,
        background: backColor ?? undefined,
      }}
      onClick={(e) => {
        e.preventDefault();
        onSelect();
      }}
      title={region.Name}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <RegionContent item={activeItem} materialIndex={materialIndex} />

        <div className="pointer-events-none absolute left-1 top-1 flex max-w-[80%] items-center gap-1 rounded bg-background/75 px-1.5 py-0.5 text-[11px] text-foreground shadow-sm">
          <span className="truncate">{region.Name || `Region ${regionIndex + 1}`}</span>
        </div>
      </div>
    </button>
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

