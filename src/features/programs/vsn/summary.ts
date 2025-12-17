import type { VsnDocument, VsnPage, VsnRegion } from './types';

export type VsnSummary = {
  pageCount: number;
  regionCount: number;
  itemCount: number;
  uniqueMaterialCount: number;
  totalDurationMs: number;
};

export function summarizeVsn(doc: VsnDocument | null): VsnSummary {
  const pages = doc?.Programs?.Program?.Pages?.Page;
  if (!Array.isArray(pages)) {
    return { pageCount: 0, regionCount: 0, itemCount: 0, uniqueMaterialCount: 0, totalDurationMs: 0 };
  }

  let regionCount = 0;
  let itemCount = 0;
  let totalDurationMs = 0;
  const materials = new Set<string>();

  for (const page of pages as VsnPage[]) {
    const regions = page?.Regions?.Region;
    const regionArr = Array.isArray(regions) ? (regions as VsnRegion[]) : [];
    regionCount += regionArr.length;
    totalDurationMs += computePageDurationMs(page);

    for (const region of regionArr) {
      const items = region?.Items?.Item;
      const itemArr = Array.isArray(items) ? items : [];
      itemCount += itemArr.length;
      for (const item of itemArr) {
        const rid = (item as { FileSource?: { Resource_ID?: unknown } }).FileSource?.Resource_ID;
        if (typeof rid === 'string' && rid.trim()) materials.add(rid);
      }
    }
  }

  return {
    pageCount: pages.length,
    regionCount,
    itemCount,
    uniqueMaterialCount: materials.size,
    totalDurationMs,
  };
}

function computePageDurationMs(page: VsnPage): number {
  const appoint = toPosInt(page.AppointDuration);
  const regions = page.Regions?.Region;
  const regionMax = Array.isArray(regions) ? Math.max(0, ...regions.map((r) => sumRegionDurationMs(r as VsnRegion))) : 0;
  if (page.LoopType === '0') return appoint ?? Math.max(1, regionMax);
  return Math.max(appoint ?? 0, regionMax);
}

function sumRegionDurationMs(region: VsnRegion): number {
  const items = region.Items?.Item;
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((acc, item) => acc + (toPosInt((item as { Duration?: unknown }).Duration) ?? 0), 0);
}

function toPosInt(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  if (!/^\d+$/.test(value)) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.trunc(num);
}

