import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { 
  MediaNode, 
  MediaLibraryUsageResponse, 
  MediaLibraryNodesResponse,
  CreateFolderRequest,
  RenameNodeRequest,
  MoveNodesRequest,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  BatchFinalizeRequest,
  BatchFinalizeResponse,
  TranscodeCreateRequest,
  TranscodeCreateResponse,
  TranscodeRetryRequest,
  TranscodeRetryResponse
} from '@/types/media-library';

/**
 * Get media library usage and quota
 */
export async function getMediaUsage(): Promise<BffResponse<MediaLibraryUsageResponse>> {
  return handleRequest<MediaLibraryUsageResponse>(
    apiClient.get('/media-library/usage')
  );
}

/**
 * Get media library nodes (files and folders)
 */
export async function getMediaNodes(params?: {
  parentId?: string | null;
  q?: string;
  sort?: 'updatedAt' | 'name' | 'size';
  limit?: number;
  cursor?: string;
}): Promise<BffResponse<MediaLibraryNodesResponse>> {
  return handleRequest<MediaLibraryNodesResponse>(
    apiClient.get('/media-library/nodes', { params })
  );
}

/**
 * Get a flattened list of media assets (for program editor, etc.)
 */
export async function getMediaAssets(params?: {
  q?: string;
  kinds?: string; // e.g., 'image,video'
  limit?: number;
  cursor?: string;
}): Promise<BffResponse<MediaLibraryNodesResponse>> {
  return handleRequest<MediaLibraryNodesResponse>(
    apiClient.get('/media-library/assets', { params })
  );
}

/**
 * Get all folders (for move/upload tree)
 */
export async function getAllFolders(): Promise<BffResponse<MediaNode[]>> {
  return handleRequest<MediaNode[]>(
    apiClient.get('/media-library/folders')
  );
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderRequest): Promise<BffResponse<MediaNode>> {
  return handleRequest<MediaNode>(
    apiClient.post('/media-library/folders', data)
  );
}

/**
 * Rename a node (folder or asset)
 */
export async function renameNode(id: string, name: string): Promise<BffResponse<void>> {
  const data: RenameNodeRequest = { name };
  return handleRequest<void>(
    apiClient.post(`/media-library/nodes/${id}/rename`, data)
  );
}

/**
 * Move nodes to a target folder
 */
export async function moveNodes(data: MoveNodesRequest): Promise<BffResponse<{ moved: number }>> {
  return handleRequest<{ moved: number }>(
    apiClient.post('/media-library/nodes/move', data)
  );
}

/**
 * Delete a node
 */
export async function deleteNode(id: string): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.post(`/media-library/nodes/${id}/delete`)
  );
}

/**
 * Check for duplicate files (MD5 check)
 */
export async function duplicateCheck(data: DuplicateCheckRequest): Promise<BffResponse<DuplicateCheckResponse>> {
  return handleRequest<DuplicateCheckResponse>(
    apiClient.post('/media-library/duplicate-check', data)
  );
}

/**
 * Finalize batch upload (record assets in DB)
 */
export async function batchFinalize(data: BatchFinalizeRequest): Promise<BffResponse<BatchFinalizeResponse>> {
  return handleRequest<BatchFinalizeResponse>(
    apiClient.post('/media-library/batch-finalize', data)
  );
}

/**
 * Create a transcoding task for a video asset
 */
export async function createTranscodeTask(
  assetId: string, 
  data: TranscodeCreateRequest
): Promise<BffResponse<TranscodeCreateResponse>> {
  return handleRequest<TranscodeCreateResponse>(
    apiClient.post(`/media-library/assets/${assetId}/transcode`, data)
  );
}

/**
 * Retry a transcoding task
 */
export async function retryTranscodeTask(
  taskId: string,
  data: TranscodeRetryRequest
): Promise<BffResponse<TranscodeRetryResponse>> {
  return handleRequest<TranscodeRetryResponse>(
    apiClient.post(`/media-library/transcode/${taskId}/retry`, data)
  );
}

/**
 * Better Upload Protocol: Get presigned URL for direct S3 upload
 * Note: This doesn't use handleRequest because it doesn't return BffResponse
 */
export async function getUploadUrls(data: {
  route: string;
  files: Array<{ name: string; size: number; type: string }>;
  metadata?: any;
}) {
  const response = await apiClient.post('/upload', data, {
    baseURL: '/api', // Override base URL
  });
  return response.data;
}