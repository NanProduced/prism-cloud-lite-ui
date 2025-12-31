import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { Device } from '@/types/device';
import type { 
  DeviceCustomFieldDef, 
  DeviceCustomFieldValue 
} from '@/types/device-custom-field';

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
 * Custom Field Management
 */

/**
 * Get all custom field definitions
 */
export async function getCustomFieldDefs(): Promise<BffResponse<DeviceCustomFieldDef[]>> {
  return handleRequest<DeviceCustomFieldDef[]>(
    apiClient.get('/devices/custom-fields')
  );
}

/**
 * Create a new custom field definition
 */
export async function createCustomFieldDef(
  data: Partial<DeviceCustomFieldDef>
): Promise<BffResponse<DeviceCustomFieldDef>> {
  return handleRequest<DeviceCustomFieldDef>(
    apiClient.post('/devices/custom-fields', data)
  );
}

/**
 * Update an existing custom field definition
 */
export async function updateCustomFieldDef(
  fieldId: number,
  data: Partial<DeviceCustomFieldDef>
): Promise<BffResponse<DeviceCustomFieldDef>> {
  return handleRequest<DeviceCustomFieldDef>(
    apiClient.post(`/devices/custom-fields/${fieldId}`, data)
  );
}

/**
 * Delete a custom field definition
 */
export async function deleteCustomFieldDef(fieldId: number): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.post(`/devices/custom-fields/${fieldId}/delete`)
  );
}

/**
 * Patch custom field values for a specific device
 * @param deviceId The backend device ID
 * @param values Map of fieldId (as string) to value
 */
export async function updateDeviceCustomFieldValues(
  deviceId: number | string,
  values: Record<string, DeviceCustomFieldValue>
): Promise<BffResponse<Record<string, any>>> {
  return handleRequest<Record<string, any>>(
    apiClient.post(`/devices/${deviceId}/custom-fields`, { values })
  );
}

/**
 * Tag Management
 */

/**
 * Get all available tags for the current user
 */
export async function getTags(): Promise<BffResponse<Tag[]>> {
  return handleRequest<Tag[]>(
    apiClient.get('/devices/tags')
  );
}

/**
 * Create a new tag
 */
export async function createTag(data: Partial<Tag>): Promise<BffResponse<Tag>> {
  return handleRequest<Tag>(
    apiClient.post('/devices/tags', data)
  );
}

/**
 * Update an existing tag definition
 */
export async function updateTag(slug: string, data: Partial<Tag>): Promise<BffResponse<Tag>> {
  return handleRequest<Tag>(
    apiClient.post(`/devices/tags/${slug}`, data)
  );
}

/**
 * Delete a tag definition
 */
export async function deleteTag(slug: string): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.post(`/devices/tags/${slug}/delete`)
  );
}

/**
 * Get tags for a specific device
 */
export async function getDeviceTags(deviceId: number | string): Promise<BffResponse<Tag[]>> {
  return handleRequest<Tag[]>(
    apiClient.get(`/devices/${deviceId}/tags`)
  );
}

/**
 * Update tags for a specific device (full replacement)
 * @param deviceId The backend device ID
 * @param tags Array of tag slugs
 */
export async function updateDeviceTags(
  deviceId: number | string,
  tags: string[]
): Promise<BffResponse<Tag[]>> {
  return handleRequest<Tag[]>(
    apiClient.post(`/devices/${deviceId}/tags`, { tags })
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

/**
 * Clear all programs cached on device (device API: DELETE api/clrprgms)
 */
export async function clearDevicePrograms(deviceId: string | number): Promise<BffResponse<any>> {
  return handleRequest<any>(
    apiClient.post(`/devices/${deviceId}/programs/clear`)
  );
}

/**
 * Delete a specific program (VSN) from device (device API: DELETE api/vsns/sources/{source}/vsns/{vsnName})
 */
export async function deleteDeviceProgram(
  deviceId: string | number,
  data: { programId?: string; vsnName?: string; source?: string }
): Promise<BffResponse<any>> {
  return handleRequest<any>(
    apiClient.post(`/devices/${deviceId}/programs/delete`, data)
  );
}
