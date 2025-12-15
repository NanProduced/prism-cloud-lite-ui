export type MediaNodeType = 'folder' | 'asset';

export type MediaAssetKind = 'image' | 'video' | 'document' | 'other';

export type MediaNodeBase = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaFolderNode = MediaNodeBase & {
  type: 'folder';
  childrenCount: number;
};

export type MediaAssetNode = MediaNodeBase & {
  type: 'asset';
  assetKind: MediaAssetKind;
  mimeType: string;
  sizeBytes: number;
  extension?: string;
  coverUrl?: string;
  assetUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

export type MediaNode = MediaFolderNode | MediaAssetNode;
