import type { MediaAssetNode } from '@/types/media-library';

export type EditorSelection = {
  pageIndex: number;
  regionIndex: number | null;
  itemIndex: number | null;
};

export type EditorMaterial = {
  assetId: string;
  materialId: string;
  source?: MediaAssetNode;
  name: string;
  kind: MediaAssetNode['assetKind'];
  extension?: string;
  coverUrl?: string;
  assetUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
};
