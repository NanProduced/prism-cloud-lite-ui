import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type {
  ProgramListResp,
  ProgramDetailResp,
  CreateProgramReq,
  ProgramDraftResp,
  SaveProgramDraftReq,
  ProgramPublishReq,
  ProgramPublishResp,
  ProgramAuditLogResp,
  ProgramTemplateResp,
  UpdateProgramReq,
} from '@/types/program';

/**
 * List all programs
 */
export const getPrograms = () =>
  handleRequest(apiClient.get<BffResponse<ProgramListResp[]>>('/programs'));

/**
 * Get program details (including drafts and versions)
 */
export const getProgramDetails = (programId: string) =>
  handleRequest(apiClient.get<BffResponse<ProgramDetailResp>>(`/programs/${programId}`));

/**
 * Get multiple programs by IDs
 */
export const getProgramsByIds = (programIds: string[]) =>
  handleRequest(apiClient.post<BffResponse<ProgramListResp[]>>('/programs/by-ids', { programIds }));

/**
 * Create a new program
 */
export const createProgram = (data: CreateProgramReq) =>
  handleRequest(apiClient.post<BffResponse<ProgramListResp>>('/programs', data));

/**
 * Update program metadata (resolution, target device, etc.)
 */
export const updateProgram = (programId: string, data: UpdateProgramReq) =>
  handleRequest(apiClient.post<BffResponse<ProgramDetailResp>>(`/programs/${programId}`, data));

/**
 * Rename program
 */
export const renameProgram = (programId: string, name: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/programs/${programId}/rename`, { name }));

/**
 * Delete program
 */
export const deleteProgram = (programId: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/programs/${programId}/delete`));

/**
 * Get program audit logs
 */
export const getProgramAuditLogs = (programId: string) =>
  handleRequest(apiClient.get<BffResponse<ProgramAuditLogResp[]>>(`/programs/${programId}/audit-logs`));

/**
 * List program templates
 */
export const getProgramTemplates = () =>
  handleRequest(apiClient.get<BffResponse<ProgramTemplateResp[]>>('/programs/templates'));

// --- Draft Management ---

/**
 * Ensure a draft exists for a program and a specific base version.
 * If baseVersion is null/0, starts from blank.
 */
export const ensureDraft = (programId: string, baseVersion?: number) => {
  const url = baseVersion && baseVersion > 0
    ? `/programs/${programId}/drafts/ensure?baseVersion=${baseVersion}` 
    : `/programs/${programId}/drafts/ensure`;
  return handleRequest(apiClient.post<BffResponse<ProgramDraftResp>>(url));
};

/**
 * Save draft content
 */
export const saveProgramDraft = (programId: string, draftId: string, data: SaveProgramDraftReq) =>
  handleRequest(apiClient.post<BffResponse<ProgramDraftResp>>(`/programs/${programId}/drafts/${draftId}/save`, data));

/**
 * Delete a specific draft
 */
export const deleteProgramDraft = (programId: string, draftId: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/programs/${programId}/drafts/${draftId}/delete`));

// --- Publishing ---

/**
 * Publish program (create new version or push existing to devices)
 */
export const publishProgram = (programId: string, data: ProgramPublishReq) =>
  handleRequest(apiClient.post<BffResponse<ProgramPublishResp>>(`/programs/${programId}/publish`, data));

/**
 * Unpublish program (remove assignment from devices)
 */
export const unpublishProgram = (programId: string, data: { scope: 'SELECTED' | 'RUNNING'; deviceIds?: number[] }) =>
  handleRequest(apiClient.post<BffResponse<any>>(`/programs/${programId}/unpublish`, data));
