import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { Device } from '@/types/device';

/**
 * Get all devices for the current user
 */
export async function getDevices(): Promise<BffResponse<Device[]>> {
  return handleRequest<Device[]>(
    apiClient.get('/devices')
  );
}

/**
 * Filter devices by name or other criteria
 */
export async function filterDevices(params: { keyword?: string }): Promise<BffResponse<Device[]>> {
  return handleRequest<Device[]>(
    apiClient.get('/devices/filter', { params })
  );
}

/**
 * Get device details by ID
 */
export async function getDevice(deviceId: number): Promise<BffResponse<Device>> {
  return handleRequest<Device>(
    apiClient.get(`/devices/${deviceId}`)
  );
}

/**
 * Update device information (alias, etc.)
 */
export async function updateDevice(
  deviceId: string, 
  data: Partial<Device>
): Promise<BffResponse<Device>> {
  return handleRequest<Device>(
    apiClient.patch(`/devices/${deviceId}`, data)
  );
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId: string): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.delete(`/devices/${deviceId}`)
  );
}

/**
 * Create a new device
 */
export async function createDevice(data: {
  displayName: string;
  account: string;
  password?: string;
  description?: string;
}): Promise<BffResponse<{
  deviceId: number;
  deviceAccount: string;
  devicePassword?: string;
}>> {
  return handleRequest<any>(
    apiClient.post('/devices', data)
  );
}

/**
 * Execute action on a single device
 */
export async function executeDeviceAction(
  deviceId: number | string,
  action: { type: string; body?: any }
): Promise<BffResponse<any>> {
  return handleRequest<any>(
    apiClient.post(`/devices/${deviceId}/actions`, action)
  );
}

/**
 * Execute actions on multiple devices in batch
 */
export async function executeBatchActions(request: {
  items: Array<{
    deviceId: number | string;
    action: {
      type: string;
      body?: any;
    };
  }>;
}): Promise<BffResponse<any>> {
  return handleRequest<any>(
    apiClient.post('/devices/actions/batch', request)
  );
}

/**
 * Get device historical screenshots
 */
export async function getDeviceScreenshots(deviceId: string | number): Promise<BffResponse<any[]>> {
  return handleRequest<any[]>(
    apiClient.get(`/devices/${deviceId}/screenshots`)
  );
}

/**
 * Delete a specific screenshot
 */
export async function deleteScreenshot(deviceId: string | number, screenshotId: string): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.delete(`/devices/${deviceId}/screenshots/${screenshotId}`)
  );
}

/**
 * Clear all screenshots for a device
 */
export async function clearScreenshots(deviceId: string | number): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.delete(`/devices/${deviceId}/screenshots`)
  );
}

/**
 * Get device bound schedule
 */
export async function getDeviceSchedule(deviceId: string | number): Promise<BffResponse<any>> {
  return handleRequest<any>(
    apiClient.get(`/devices/${deviceId}/schedule`)
  );
}

/**
 * Get device program visibility rules (Allowlist)
 */
export async function getDeviceProgramAllowlist(deviceId: string | number): Promise<BffResponse<any[]>> {
  return handleRequest<any[]>(
    apiClient.get(`/devices/${deviceId}/program-allowlist`)
  );
}
