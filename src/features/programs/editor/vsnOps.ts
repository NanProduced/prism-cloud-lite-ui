import { createBlankVsnPage, createBlankVsnRegion } from '@/features/programs/vsn/defaults';
import type { VsnDocument, VsnItem, VsnPage, VsnRect, VsnRegion } from '@/features/programs/vsn/types';

export function cloneVsn<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getPages(doc: VsnDocument | null): VsnPage[] {
  if (!doc) return [];
  const pages = doc.Programs?.Program?.Pages?.Page;
  return Array.isArray(pages) ? pages : [];
}

export function getRegions(doc: VsnDocument | null, pageIndex: number): VsnRegion[] {
  const page = getPages(doc)[pageIndex];
  const regions = page?.Regions?.Region;
  return Array.isArray(regions) ? regions : [];
}

export function getItems(doc: VsnDocument | null, pageIndex: number, regionIndex: number): VsnItem[] {
  const region = getRegions(doc, pageIndex)[regionIndex];
  const items = region?.Items?.Item;
  return Array.isArray(items) ? items : [];
}

export function addPage(doc: VsnDocument, input: { width: number; height: number; durationMs?: number }): { doc: VsnDocument; pageIndex: number } {
  const next = cloneVsn(doc);
  const pages = next.Programs.Program.Pages.Page;
  const page = createBlankVsnPage({
    width: input.width,
    height: input.height,
    durationMs: input.durationMs ?? 10_000,
  });
  pages.push(page);
  return { doc: next, pageIndex: pages.length - 1 };
}

export function deletePage(doc: VsnDocument, pageIndex: number): VsnDocument {
  const next = cloneVsn(doc);
  const pages = next.Programs.Program.Pages.Page;
  if (!Array.isArray(pages)) return doc;
  if (pageIndex < 0 || pageIndex >= pages.length) return doc;
  if (pages.length <= 1) return doc;
  pages.splice(pageIndex, 1);
  return next;
}

export function addRegion(
  doc: VsnDocument,
  pageIndex: number,
  input: { name?: string; rect?: Partial<VsnRect> },
): { doc: VsnDocument; regionIndex: number } {
  const next = cloneVsn(doc);
  const pages = next.Programs.Program.Pages.Page;
  const page = pages[pageIndex];
  if (!page) return { doc, regionIndex: 0 };

  const width = parseInt(next.Programs.Program.Information.Width, 10) || 1920;
  const height = parseInt(next.Programs.Program.Information.Height, 10) || 1080;

  const regions = page.Regions.Region;
  const nextLayer = Math.max(
    0,
    ...regions.map((r) => Number.parseInt((r as VsnRegion).Layer ?? '0', 10) || 0),
  ) + 1;

  const region = createBlankVsnRegion({
    name: input.name ?? `Region ${regions.length + 1}`,
    layer: nextLayer,
    rect: {
      X: String(input.rect?.X ?? Math.round(width * 0.1)),
      Y: String(input.rect?.Y ?? Math.round(height * 0.1)),
      Width: String(input.rect?.Width ?? Math.round(width * 0.8)),
      Height: String(input.rect?.Height ?? Math.round(height * 0.3)),
      BorderWidth: String(input.rect?.BorderWidth ?? 0),
      BorderColor: input.rect?.BorderColor ?? '#000000',
      BackColor: input.rect?.BackColor ?? null,
    },
  });

  regions.push(region);
  return { doc: next, regionIndex: regions.length - 1 };
}

export function duplicateRegion(doc: VsnDocument, pageIndex: number, regionIndex: number): { doc: VsnDocument; regionIndex: number } {
  const next = cloneVsn(doc);
  const page = next.Programs.Program.Pages.Page[pageIndex];
  if (!page) return { doc, regionIndex };
  const regions = page.Regions?.Region;
  if (!Array.isArray(regions)) return { doc, regionIndex };
  const original = regions[regionIndex] as VsnRegion | undefined;
  if (!original) return { doc, regionIndex };

  const copy = cloneVsn(original) as VsnRegion;

  const nextLayer = Math.max(
    0,
    ...regions.map((r) => Number.parseInt((r as VsnRegion).Layer ?? '0', 10) || 0),
  ) + 1;
  copy.Layer = String(nextLayer);

  const baseName = (copy.Name ?? '').trim() || `Region ${regions.length + 1}`;
  copy.Name = `${baseName} Copy`;

  const programWidth = Number.parseInt(next.Programs.Program.Information.Width, 10) || 1920;
  const programHeight = Number.parseInt(next.Programs.Program.Information.Height, 10) || 1080;
  const dx = 24;
  const dy = 24;

  const rect = copy.Rect;
  const parsedX = Number.parseInt(rect?.X ?? '0', 10);
  const parsedY = Number.parseInt(rect?.Y ?? '0', 10);
  const parsedW = Number.parseInt(rect?.Width ?? '0', 10);
  const parsedH = Number.parseInt(rect?.Height ?? '0', 10);

  const width = clampInt(parsedW, 1, programWidth);
  const height = clampInt(parsedH, 1, programHeight);
  const x = clampInt(parsedX + dx, 0, Math.max(0, programWidth - width));
  const y = clampInt(parsedY + dy, 0, Math.max(0, programHeight - height));

  copy.Rect = {
    ...(copy.Rect ?? {}),
    X: String(x),
    Y: String(y),
    Width: String(width),
    Height: String(height),
  } as VsnRect;

  regions.push(copy);
  return { doc: next, regionIndex: regions.length - 1 };
}

export function deleteRegion(doc: VsnDocument, pageIndex: number, regionIndex: number): VsnDocument {
  const next = cloneVsn(doc);
  const page = next.Programs.Program.Pages.Page[pageIndex];
  if (!page) return doc;
  const regions = page.Regions.Region;
  if (!Array.isArray(regions)) return doc;
  if (regionIndex < 0 || regionIndex >= regions.length) return doc;
  regions.splice(regionIndex, 1);
  return next;
}

export function addItem(doc: VsnDocument, pageIndex: number, regionIndex: number, item: VsnItem): { doc: VsnDocument; itemIndex: number } {
  const next = cloneVsn(doc);
  const region = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex];
  if (!region) return { doc, itemIndex: 0 };
  region.Items.Item.push(item);
  return { doc: next, itemIndex: region.Items.Item.length - 1 };
}

export function deleteItem(doc: VsnDocument, pageIndex: number, regionIndex: number, itemIndex: number): VsnDocument {
  const next = cloneVsn(doc);
  const region = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex];
  const items = region?.Items?.Item;
  if (!region || !Array.isArray(items)) return doc;
  if (itemIndex < 0 || itemIndex >= items.length) return doc;
  items.splice(itemIndex, 1);
  return next;
}

export function moveItem(doc: VsnDocument, pageIndex: number, regionIndex: number, from: number, to: number): VsnDocument {
  const next = cloneVsn(doc);
  const region = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex];
  const items = region?.Items?.Item;
  if (!region || !Array.isArray(items)) return doc;
  if (from < 0 || from >= items.length) return doc;
  const clampedTo = Math.max(0, Math.min(items.length - 1, to));
  if (from === clampedTo) return doc;
  const [picked] = items.splice(from, 1);
  items.splice(clampedTo, 0, picked);
  return next;
}

export function patchPage(doc: VsnDocument, pageIndex: number, patch: Partial<VsnPage>): VsnDocument {
  const next = cloneVsn(doc);
  const page = next.Programs.Program.Pages.Page[pageIndex];
  if (!page) return doc;
  next.Programs.Program.Pages.Page[pageIndex] = { ...page, ...patch };
  return next;
}

export function patchRegion(doc: VsnDocument, pageIndex: number, regionIndex: number, patch: Partial<VsnRegion>): VsnDocument {
  const next = cloneVsn(doc);
  const region = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex];
  if (!region) return doc;
  next.Programs.Program.Pages.Page[pageIndex].Regions.Region[regionIndex] = { ...region, ...patch };
  return next;
}

export function patchRegionRect(doc: VsnDocument, pageIndex: number, regionIndex: number, patch: Partial<VsnRect>): VsnDocument {
  const next = cloneVsn(doc);
  const region = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex];
  if (!region) return doc;
  region.Rect = { ...region.Rect, ...patch };

  const programWidth = Number.parseInt(next.Programs.Program.Information.Width, 10);
  const programHeight = Number.parseInt(next.Programs.Program.Information.Height, 10);

  if (Number.isFinite(programWidth) && programWidth > 0 && Number.isFinite(programHeight) && programHeight > 0) {
    const rect = region.Rect;
    const parsedX = Number.parseInt(rect.X ?? '0', 10);
    const parsedY = Number.parseInt(rect.Y ?? '0', 10);
    const parsedW = Number.parseInt(rect.Width ?? String(programWidth), 10);
    const parsedH = Number.parseInt(rect.Height ?? String(programHeight), 10);

    const width = clampInt(parsedW, 1, programWidth);
    const height = clampInt(parsedH, 1, programHeight);
    const x = clampInt(parsedX, 0, Math.max(0, programWidth - width));
    const y = clampInt(parsedY, 0, Math.max(0, programHeight - height));

    rect.X = String(x);
    rect.Y = String(y);
    rect.Width = String(width);
    rect.Height = String(height);

    const borderWidth = Number.parseInt(rect.BorderWidth ?? '0', 10);
    rect.BorderWidth = String(clampInt(borderWidth, 0, 10_000));
  }
  return next;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function patchItem(doc: VsnDocument, pageIndex: number, regionIndex: number, itemIndex: number, patch: Partial<VsnItem>): VsnDocument {
  const next = cloneVsn(doc);
  const item = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex]?.Items?.Item?.[itemIndex];
  if (!item) return doc;
  next.Programs.Program.Pages.Page[pageIndex].Regions.Region[regionIndex].Items.Item[itemIndex] = { ...item, ...patch };
  return next;
}

export function resizeProgramCanvas(doc: VsnDocument, input: { width: number; height: number }): VsnDocument {
  const next = cloneVsn(doc);

  const prevWidth = Number.parseInt(next.Programs.Program.Information.Width ?? '', 10);
  const prevHeight = Number.parseInt(next.Programs.Program.Information.Height ?? '', 10);

  const width = Math.max(1, Math.round(input.width));
  const height = Math.max(1, Math.round(input.height));

  next.Programs.Program.Information.Width = String(width);
  next.Programs.Program.Information.Height = String(height);

  if (!Number.isFinite(prevWidth) || prevWidth <= 0 || !Number.isFinite(prevHeight) || prevHeight <= 0) {
    return next;
  }

  const sx = width / prevWidth;
  const sy = height / prevHeight;

  const pages = next.Programs.Program.Pages?.Page;
  if (!Array.isArray(pages)) return next;

  pages.forEach((page) => {
    const regions = page.Regions?.Region;
    if (!Array.isArray(regions)) return;

    regions.forEach((region) => {
      const rect = region.Rect;
      const x = Number.parseInt(rect?.X ?? '0', 10) || 0;
      const y = Number.parseInt(rect?.Y ?? '0', 10) || 0;
      const w = Number.parseInt(rect?.Width ?? '1', 10) || 1;
      const h = Number.parseInt(rect?.Height ?? '1', 10) || 1;

      const nextW = clampInt(Math.max(1, Math.round(w * sx)), 1, width);
      const nextH = clampInt(Math.max(1, Math.round(h * sy)), 1, height);
      const nextX = clampInt(Math.round(x * sx), 0, Math.max(0, width - nextW));
      const nextY = clampInt(Math.round(y * sy), 0, Math.max(0, height - nextH));

      rect.X = String(nextX);
      rect.Y = String(nextY);
      rect.Width = String(nextW);
      rect.Height = String(nextH);
    });
  });

  return next;
}

export function normalizeVsnForEditor(doc: VsnDocument): VsnDocument {
  const programWidth = Number.parseInt(doc.Programs?.Program?.Information?.Width ?? '', 10);
  const programHeight = Number.parseInt(doc.Programs?.Program?.Information?.Height ?? '', 10);
  if (!Number.isFinite(programWidth) || programWidth <= 0 || !Number.isFinite(programHeight) || programHeight <= 0) {
    return doc;
  }

  const pages = doc.Programs?.Program?.Pages?.Page;
  if (!Array.isArray(pages) || pages.length === 0) return doc;

  let changed = false;
  const next = cloneVsn(doc);

  next.Programs.Program.Pages.Page.forEach((page) => {
    const regions = page?.Regions?.Region;
    if (!Array.isArray(regions) || regions.length !== 1) return;
    const region = regions[0] as VsnRegion | undefined;
    if (!region) return;

    const name = (region.Name ?? '').trim();
    if (name !== 'Main Window') return;
    const items = region.Items?.Item;
    if (Array.isArray(items) && items.length > 0) return;

    const rect = region.Rect;
    const x = Number.parseInt(rect?.X ?? '', 10);
    const y = Number.parseInt(rect?.Y ?? '', 10);
    const w = Number.parseInt(rect?.Width ?? '', 10);
    const h = Number.parseInt(rect?.Height ?? '', 10);
    const bw = Number.parseInt(rect?.BorderWidth ?? '0', 10) || 0;
    const isFull =
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(w) &&
      Number.isFinite(h) &&
      x === 0 &&
      y === 0 &&
      w === programWidth &&
      h === programHeight &&
      bw === 0;
    if (!isFull) return;

    page.Regions.Region = [];
    changed = true;
  });

  return changed ? next : doc;
}
