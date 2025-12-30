/**
 * Program Module Type Definitions
 * Aligned with docs/integration/program-and-schedule.md
 */

export interface ProgramListResp {
  id: string; // UUID
  name: string;
  width: number;
  height: number;
  defaultVersion?: number;
  latestVersion?: number | null;
  latestReleaseAt?: string | null;
  latestDraftAt?: string | null;
  unpublishedChanges: boolean;
  coverUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDraftResp {
  // Backend uses `draftId`; keep `id` optional for legacy UI compatibility.
  draftId: string; // UUID
  id?: string;
  programId: string;
  baseVersion: number; // 0 = Blank, N = from vN
  vsnJson: string; // The full editor JSON content
  coverUrl?: string | null;
  contentHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramVersionResp {
  version: number; // Platform version v1, v2...
  deviceProgramId: number; // Colorlight integer ID
  programId: string;
  deviceTitleSnapshot?: string | null;
  vsnMd5?: string | null;
  vsnSizeBytes?: number | null;
  coverUrl?: string | null;
  createdAt: string;
}

export interface ProgramDeploymentResp {
  programId: string;
  deviceId: number;
  deviceName?: string | null;
  releaseVersion: number;
  releaseProgramId: number;
  status?: 'DOWNLOADING' | 'DOWNLOADED' | null;
  assignedAt: string;
  updatedAt?: string | null;
}

export interface ProgramDetailResp {
  id: string;
  name: string;
  width: number;
  height: number;
  defaultVersion?: number;
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

export interface UpdateProgramReq {
  name?: string;
  width?: number;
  height?: number;
  targetDeviceId?: string | null;
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
  coverContentType?: string;
  scope: 'SELECTED' | 'RUNNING';
  deviceIds?: number[];
  mode: 'APPEND' | 'OVERWRITE';
}

export interface ProgramPublishResult {
  deviceId: number;
  action: 'deploy' | 'update' | 'rollback' | 'no-change' | 'skip' | 'undeploy';
  affected?: boolean;
  commandId?: string;
  queuedId?: number;
  accepted: boolean;
  errorMessage?: string;
}

export interface ProgramPublishResp {
  programId: string;
  version: number;
  deviceProgramId: number;
  totalTargets: number;
  affected: number;
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
