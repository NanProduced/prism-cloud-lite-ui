import apiClient, { handleRequest } from './apiClient';
import type { 
  ExportType, 
  ExportSchemaResponse, 
  CreateExportRequest, 
  CreateExportResponse,
  ExportDownloadResponse
} from '@/types/export';

/**
 * Get export schema for a specific export type
 */
export async function getExportSchema(type: ExportType) {
  return handleRequest<ExportSchemaResponse>(
    apiClient.get('/exports/schema', { params: { type } })
  );
}

/**
 * Create a new export task
 */
export async function createExportTask(request: CreateExportRequest) {
  return handleRequest<CreateExportResponse>(
    apiClient.post('/exports', request)
  );
}

/**
 * Get presigned download URL for a completed export
 */
export async function getExportDownloadUrl(exportId: string) {
  return handleRequest<ExportDownloadResponse>(
    apiClient.get(`/exports/${exportId}/download`)
  );
}

/**
 * Delete an export file to release quota
 */
export async function deleteExport(exportId: string) {
  return handleRequest<void>(
    apiClient.post(`/exports/${exportId}/delete`)
  );
}
