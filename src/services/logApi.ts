import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { 
  DeviceLogType, 
  DeviceLogPageResp, 
  DeviceLogListItem,
  DeviceCommandLogPageResp,
  DeviceCommandLogListItem,
  DeviceLogFilterParams,
  CommandLogFilterParams
} from '@/types/log';

/**
 * Get device log types (dictionary)
 */
export async function getDeviceLogTypes(): Promise<BffResponse<DeviceLogType[]>> {
  return handleRequest<DeviceLogType[]>(
    apiClient.get('/device-logs/types')
  );
}

/**
 * Get device logs (paginated)
 */
export async function getDeviceLogs(params: DeviceLogFilterParams): Promise<BffResponse<DeviceLogPageResp>> {
  return handleRequest<DeviceLogPageResp>(
    apiClient.get('/device-logs', { params })
  );
}

/**
 * Get device log details
 */
export async function getDeviceLog(logId: string): Promise<BffResponse<DeviceLogListItem>> {
  return handleRequest<DeviceLogListItem>(
    apiClient.get(`/device-logs/${logId}`)
  );
}

/**
 * Get device command logs (paginated)
 */
export async function getDeviceCommandLogs(params: CommandLogFilterParams): Promise<BffResponse<DeviceCommandLogPageResp>> {
  return handleRequest<DeviceCommandLogPageResp>(
    apiClient.get('/device-command-logs', { params })
  );
}

/**
 * Get device command log details
 */
export async function getDeviceCommandLog(logId: string): Promise<BffResponse<DeviceCommandLogListItem>> {
  return handleRequest<DeviceCommandLogListItem>(
    apiClient.get(`/device-command-logs/${logId}`)
  );
}
