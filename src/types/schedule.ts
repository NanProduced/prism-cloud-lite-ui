// Schedule Type Definitions
// Aligned with core-service ScheduleController + docs/integration/program-and-schedule.md

export type ContentsScheduleType = 'rotation' | 'spot';

export type ScheduleCommandActionType =
  | 'BRIGHTNESS'
  | 'VOLUME'
  | 'COLOR_TEMP'
  | 'POWER'
  | 'INPUT_MODE'
  | 'CLEAR_CACHE';

export type JsonObject = Record<string, unknown>;
export type JsonValue = null | boolean | number | string | JsonObject | JsonValue[];

export interface ScheduleListResp {
  scheduleId: string; // UUID
  name: string;
  description?: string | null;
  enabled: boolean;
  boundDevices: number;
  programRules: number;
  commandRules: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDetailResp {
  scheduleId: string; // UUID
  name: string;
  description?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  boundDeviceIds: number[];
  contentsRules: ScheduleContentsRuleResp[];
  commandRules: ScheduleCommandRuleResp[];
}

export interface ScheduleContentsRuleResp {
  id: number;
  scheduleId: string;
  type: ContentsScheduleType;
  priority: number;
  releaseProgramId: number; // ProgramRelease.deviceProgramId (Integer)
  programId?: string | null;
  releaseVersion?: number | null;
  deviceTitleSnapshot?: string | null;
  ifLimitTime?: boolean | null;
  limitTime?: JsonValue;
  ifLimitDate?: boolean | null;
  limitDate?: JsonValue;
  ifLimitWeekday?: boolean | null;
  limitWeekday?: JsonValue;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleCommandRuleResp {
  id: number;
  scheduleId: string;
  payload: JsonValue; // device protocol commandSchedule element (opaque to UI unless parsed)
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleBindingDeviceResp {
  deviceId: number;
  deviceName?: string | null;
  onlineStatus?: number | null;
  boundAt: string;
}

export interface ScheduleBindDevicesReq {
  deviceIds: number[];
  replaceExisting?: boolean;
}

export interface ScheduleBindDevicesResultResp {
  deviceId: number;
  status: 'bound' | 'no-change' | 'conflict' | 'skip' | string;
  previousScheduleId?: string | null;
}

export interface ScheduleBindDevicesResp {
  totalTargets: number;
  bound: number;
  conflicts: number;
  results: ScheduleBindDevicesResultResp[];
}

export interface SchedulePushReq {
  deviceIds?: number[];
}

export interface SchedulePushResultResp {
  deviceId: number;
  commandId?: string | null;
  accepted: boolean;
  queuedId?: number | null;
  errorMessage?: string | null;
}

export interface SchedulePushResp {
  totalTargets: number;
  accepted: number;
  results: SchedulePushResultResp[];
}

export interface DeviceActionBase {
  type: ScheduleCommandActionType;
  ttlMinutes?: number | null;
  clientRequestId?: string | null;
  body?: JsonObject | null;
}

export interface UpsertScheduleContentsRuleReq {
  id?: number | null;
  type: ContentsScheduleType;
  priority: number;
  releaseProgramId: number;
  ifLimitTime?: boolean | null;
  limitTime?: JsonValue;
  ifLimitDate?: boolean | null;
  limitDate?: JsonValue;
  ifLimitWeekday?: boolean | null;
  limitWeekday?: JsonValue;
}

export interface UpsertScheduleCommandRuleReq {
  id?: number | null;
  operation: DeviceActionBase;
  opTime: string[]; // ["HH:mm:ss", ...]
  ifLimitDate?: boolean | null;
  limitDate?: JsonValue;
  ifLimitWeekday?: boolean | null;
  limitWeekday?: JsonValue;
}

export interface CreateScheduleReq {
  name: string;
  description?: string | null;
  enabled?: boolean | null;
  contentsRules?: UpsertScheduleContentsRuleReq[] | null;
  commandRules?: UpsertScheduleCommandRuleReq[] | null;
}

export interface UpdateScheduleReq {
  name?: string | null;
  description?: string | null;
  enabled?: boolean | null;
  contentsRules?: UpsertScheduleContentsRuleReq[] | null;
  commandRules?: UpsertScheduleCommandRuleReq[] | null;
}

export interface ScheduleAuditLogResp {
  id: number;
  userId: string;
  scheduleId: string;
  action: string;
  details?: string | null;
  createdAt: string;
}

export interface DeviceScheduleResp {
  deviceId: number;
  scheduleId?: string | null;
  scheduleName?: string | null;
  scheduleDescription?: string | null;
  scheduleEnabled?: boolean | null;
  scheduleCreatedAt?: string | null;
  scheduleUpdatedAt?: string | null;
  boundAt?: string | null;
  programRulesCount: number;
  commandRulesCount: number;
  contentsRules: ScheduleContentsRuleResp[];
  commandRules: ScheduleCommandRuleResp[];
}

