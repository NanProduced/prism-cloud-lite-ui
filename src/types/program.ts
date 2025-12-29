/**
 * Program Module Type Definitions
 * Aligned with docs/integration/program-and-schedule.md
 */

export interface ProgramListResp {
  id: string; // UUID
  name: string;
  width: number;
  height: number;
  latestVersion?: number;
  latestReleaseAt?: string;
  latestDraftAt?: string;
  unpublishedChanges: boolean;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDraftResp {
  id: string; // UUID
  programId: string;
  baseVersion: number | null;
  vsnJson: string; // The full editor JSON content
  coverUrl?: string;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramVersionResp {
  version: number; // Platform version v1, v2...
  deviceProgramId: number; // Colorlight integer ID
  programId: string;
  vsnJson: string;
  coverUrl?: string;
  createdAt: string;
}

export interface ProgramDeploymentResp {
  deviceId: string;
  deviceName?: string;
  version: number;
  status: 'DOWNLOADING' | 'DOWNLOADED' | null;
  assignedAt: string;
  updatedAt?: string;
}

export interface ProgramDetailResp {
  id: string;
  name: string;
  width: number;
  height: number;
  targetDeviceId?: string | null;
  drafts: ProgramDraftResp[];
  versions: ProgramVersionResp[];
  deployments: ProgramDeploymentResp[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramReq {
  name: string;
  width: number;
  height: number;
}

export interface SaveProgramDraftReq {
  vsnJson: string;
  coverBase64?: string; // Optional cover image
  coverContentType?: string;
  contentHash?: string;
}

export interface ProgramPublishReq {
  versionMode: 'CREATE' | 'EXISTING';
  existingVersion?: number;
  draftId?: string;
  vsnJson?: string;
  coverBase64?: string;
  scope: 'SELECTED' | 'RUNNING';
  deviceIds?: string[];
  mode: 'APPEND' | 'OVERWRITE';
}

export interface ProgramPublishResult {
  deviceId: string;
  action: 'deploy' | 'update' | 'rollback' | 'no-change' | 'skip' | 'undeploy';
  commandId?: string;
  accepted: boolean;
  errorMessage?: string;
}

export interface ProgramPublishResp {
  publishOperationId: string;
  results: ProgramPublishResult[];
}

export interface ProgramAuditLogResp {
  id: string;
  action: string;
  version?: number;
  operatorName: string;
  createdAt: string;
  metadata?: string;
}

export interface ProgramTemplateResp {
  id: string;
  name: string;
  width: number;
  height: number;
  coverUrl: string;
  vsnJson: string;
  updatedAt?: string;
}
