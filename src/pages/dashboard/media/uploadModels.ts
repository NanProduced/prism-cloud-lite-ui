import type { MediaAssetKind } from '@/types/media-library';

export type PendingUploadFile = {
  id: string;
  file: File;
  kind: MediaAssetKind;
  title: string;
  width?: number;
  height?: number;
  durationMs?: number;
  parseError?: string;
};

export type UploadTaskStatus =
  | 'verifying'
  | 'checking'
  | 'uploading'
  | 'finalizing'
  | 'done'
  | 'error'
  | 'canceled';

export type UploadTask = {
  groupId: string;
  folderId: string | null;
  title: string;
  original: File;
  kind: MediaAssetKind;
  status: UploadTaskStatus;
  progress: number; // 0..1
  bytesTotal: number;
  bytesUploaded: number;
  throughputBps?: number;
  md5?: string;
  createdAt: number;
  error?: string;
};
