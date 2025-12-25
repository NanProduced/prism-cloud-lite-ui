import apiClient, { handleRequest, BffResponse } from './apiClient';
import type { MediaNode } from '../types/media-library';

/**
 * Get media library items
 */
export async function getMediaItems(params?: {
  type?: string;
  folderId?: string;
  search?: string;
}): Promise<BffResponse<MediaNode[]>> {
  return handleRequest<MediaNode[]>(
    apiClient.get('/media-library', { params })
  );
}

/**
 * Upload file to media library
 * Note: Uses /api/upload prefix as per documentation
 */
export async function uploadFile(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<BffResponse<MediaNode>> {
  const formData = new FormData();
  formData.append('file', file);

  return handleRequest<MediaNode>(
    apiClient.post('/upload', formData, {
      baseURL: '/api', // Override base URL for upload endpoint
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    })
  );
}

/**
 * Delete media item
 */
export async function deleteMediaItem(itemId: string): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.delete(`/media-library/${itemId}`)
  );
}
