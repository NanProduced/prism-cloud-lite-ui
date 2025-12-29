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
  cover?: Blob;
  coverWidth?: number;
  coverHeight?: number;
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
  coverMd5?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  coverWidth?: number;
  coverHeight?: number;
  createdAt: number;
  error?: string;
  cover?: Blob;
};
