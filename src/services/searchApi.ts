import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { SearchData, SearchParams } from '@/types/search';

/**
 * Unified search API for devices, programs, and media.
 */
export async function searchUnified(params: SearchParams): Promise<BffResponse<SearchData>> {
  return handleRequest(
    apiClient.get<BffResponse<SearchData>>('/search', { params })
  );
}
