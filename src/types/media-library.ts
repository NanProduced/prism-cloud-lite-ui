export type MediaNodeType = 'folder' | 'asset';

export type MediaAssetKind = 'image' | 'video' | 'document' | 'other';

export interface MediaNodeBase {
  id: string;
  type: MediaNodeType;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolderNode extends MediaNodeBase {
  type: 'folder';
  childrenCount: number;
}

export interface MediaAssetNode extends MediaNodeBase {
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
}

export type MediaNode = MediaFolderNode | MediaAssetNode;

export interface MediaLibraryUsageResponse {
  quotaBytes: number;
  usedBytes: number;
  bytesByKind: Record<MediaAssetKind, number>;
  counts: Record<MediaAssetKind | 'folders', number>;
}

export interface MediaLibraryNodesResponse {
  items: MediaNode[];
  nextCursor: string | null;
}

export interface CreateFolderRequest {
  parentId?: string | null;
  name: string;
}

export interface RenameNodeRequest {
  name: string;
}

export interface MoveNodesRequest {
  nodeIds: string[];
  targetParentId?: string | null;
}

export interface DuplicateCheckFile {
  clientId: string;
  md5?: string;
  size: number;
  type: string;
}

export interface DuplicateCheckRequest {
  files: DuplicateCheckFile[];
}

export interface DuplicateCheckResult {
  clientId: string;
  duplicate: boolean;
  fileEntityId?: string;
}

export interface DuplicateCheckResponse {
  results: DuplicateCheckResult[];
}

export interface BatchFinalizeItemFile {
  role: 'original' | 'cover';
  s3Key?: string;
  fileEntityId?: string;
  size: number;
  type: string;
  originalName: string;
  md5?: string;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface BatchFinalizeItem {
  groupId: string;
  title: string;
  files: BatchFinalizeItemFile[];
}

export interface BatchFinalizeRequest {
  folderId?: string | null;
  items: BatchFinalizeItem[];
}

export interface BatchFinalizeResponse {
  assets: Array<{
    assetId: string;
    groupId: string;
    existed: boolean;
    sourceType: number;
    originalFile: any;
    coverFile?: any;
  }>;
}

export interface TranscodeCreateRequest {
  presetId: string;
  targetFolderId?: string | null;
  options?: Record<string, any>;
}

export interface TranscodeCreateResponse {
  taskId: string;
  messageId: string;
}