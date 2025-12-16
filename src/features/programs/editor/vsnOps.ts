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

export function deleteRegion(doc: VsnDocument, pageIndex: number, regionIndex: number): VsnDocument {
  const next = cloneVsn(doc);
  const page = next.Programs.Program.Pages.Page[pageIndex];
  if (!page) return doc;
  const regions = page.Regions.Region;
  if (!Array.isArray(regions)) return doc;
  if (regionIndex < 0 || regionIndex >= regions.length) return doc;
  if (regions.length <= 1) return doc;
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
  return next;
}

export function patchItem(doc: VsnDocument, pageIndex: number, regionIndex: number, itemIndex: number, patch: Partial<VsnItem>): VsnDocument {
  const next = cloneVsn(doc);
  const item = next.Programs.Program.Pages.Page[pageIndex]?.Regions?.Region?.[regionIndex]?.Items?.Item?.[itemIndex];
  if (!item) return doc;
  next.Programs.Program.Pages.Page[pageIndex].Regions.Region[regionIndex].Items.Item[itemIndex] = { ...item, ...patch };
  return next;
}

