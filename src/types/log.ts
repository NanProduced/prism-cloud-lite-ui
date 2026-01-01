// Log Type Definitions for Prism Cloud Lite

export interface DeviceLogType {
  id: number;
  operation: string;
  type: string;
  subType: string;
}

export interface DeviceLogListItem {
  id: string;
  logId: string;
  deviceId: number;
  deviceName: string;
  operationId: number; // DeviceLogType.id
  operationName: string; // From dictionary
  level: string;
  content: string;
  createTime: string; // Server time (UTC)
  reportTime: string; // Device time
}

export interface DeviceLogPageResp {
  items: DeviceLogListItem[];
  page: number;
  size: number;
  total: number;
}

export interface DeviceCommandLogListItem {
  id: number;
  deviceId: number;
  deviceName: string;
  operationId: string; // commandId
  actionType: string;
  trackingLevel: string;
  status: string;
  accepted: boolean;
  covered: boolean;
  sendMethod: string | null;
  queuedId: number | null;
  errorMessage?: string | null;
  createdAt: string; // Server time (UTC)
  updatedAt: string; // Server time (UTC)
}

export interface DeviceCommandLogDetail {
  id: number;
  deviceId: number;
  deviceName: string;
  operationId: string;
  actionType: string;
  trackingLevel: string;
  status: string;
  payload: string | null; // JSON string
  ttlMinutes: number | null;
  sendMethod: string | null;
  queuedId: number | null;
  accepted: boolean;
  covered: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCommandLogPageResp {
  items: DeviceCommandLogListItem[];
  page: number;
  size: number;
  total: number;
}

export interface LogFilterParams {
  from?: string;
  to?: string;
  deviceId?: number;
  page?: number;
  size?: number;
}

export interface DeviceLogFilterParams extends LogFilterParams {
  operationIds?: number[];
}

export interface CommandLogFilterParams extends LogFilterParams {
  operationId?: string;
  actionTypes?: string[];
  statuses?: string[];
  accepted?: boolean;
  covered?: boolean;
  queuedId?: number;
  sendMethod?: string;
}
