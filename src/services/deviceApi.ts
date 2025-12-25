import apiClient, { handleRequest, BffResponse } from './apiClient';
import type { Device } from '../types/device';

/**
 * Get all devices for the current user
 */
export async function getDevices(): Promise<BffResponse<Device[]>> {
  return handleRequest<Device[]>(
    apiClient.get('/devices')
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
 * Execute action on a single device
 */
export async function executeDeviceAction(
  deviceId: number,
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
  actions: Array<{
    targetDeviceId: number;
    type: string;
    body?: any;
  }>;
}): Promise<BffResponse<any>> {
  return handleRequest<any>(
    apiClient.post('/devices/actions/batch', request)
  );
}
