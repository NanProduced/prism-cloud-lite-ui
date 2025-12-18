import type { MediaNode } from '@/types/media-library';

import { resolveMaterialId } from '@/features/programs/storage/materialId';
import type { VsnDocument, VsnPage, VsnRegion } from '@/features/programs/vsn/types';

export function collectMaterialIds(doc: VsnDocument | null): string[] {
  const pages = doc?.Programs?.Program?.Pages?.Page;
  if (!Array.isArray(pages)) return [];

  const ids = new Set<string>();
  for (const page of pages as VsnPage[]) {
    const regions = page?.Regions?.Region;
    const regionArr = Array.isArray(regions) ? (regions as VsnRegion[]) : [];
    for (const region of regionArr) {
      const items = region?.Items?.Item;
      const itemArr = Array.isArray(items) ? items : [];
      for (const item of itemArr) {
        const rid = (item as { FileSource?: { Resource_ID?: unknown } }).FileSource?.Resource_ID;
        if (typeof rid === 'string' && rid.trim()) ids.add(rid);
      }
    }
  }

  return [...ids];
}

export function buildMaterialSizeIndex(nodes: MediaNode[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const node of nodes) {
    if (node.type !== 'asset') continue;
    const materialId = resolveMaterialId(node.id);
    index.set(materialId, node.sizeBytes);
  }
  return index;
}

export function sumMaterialBytes(materialIds: string[], sizeIndex: Map<string, number>): number {
  let total = 0;
  for (const id of materialIds) {
    total += sizeIndex.get(id) ?? 0;
  }
  return total;
}

export function sumMaterialBytesForDoc(doc: VsnDocument | null, sizeIndex: Map<string, number>): number {
  return sumMaterialBytes(collectMaterialIds(doc), sizeIndex);
}

