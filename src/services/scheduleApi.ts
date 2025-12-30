import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { 
  ScheduleListResp,
  ScheduleDetailResp,
  CreateScheduleReq, 
  UpdateScheduleReq,
  ScheduleBindingDeviceResp,
  ScheduleBindDevicesResp,
  SchedulePushResp,
  ScheduleAuditLogResp,
} from '@/types/schedule';

/**
 * Get all playback schedules for current user
 */
export const getSchedules = () =>
  handleRequest(apiClient.get<BffResponse<ScheduleListResp[]>>('/schedules'));

/**
 * Get single schedule details including rules
 */
export const getScheduleDetails = (scheduleId: string) =>
  handleRequest(apiClient.get<BffResponse<ScheduleDetailResp>>(`/schedules/${scheduleId}`));

/**
 * Create a new schedule
 */
export const createSchedule = (data: CreateScheduleReq) =>
  handleRequest(apiClient.post<BffResponse<ScheduleDetailResp>>('/schedules', data));

/**
 * Update schedule rules or metadata
 * Note: contentsRules/commandRules follow 'replace' semantics if not null
 */
export const updateSchedule = (scheduleId: string, data: UpdateScheduleReq) =>
  handleRequest(apiClient.post<BffResponse<ScheduleDetailResp>>(`/schedules/${scheduleId}`, data));

/**
 * Delete a schedule
 */
export const deleteSchedule = (scheduleId: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/schedules/${scheduleId}/delete`));

/**
 * Push schedule updates to hardware terminals
 * If deviceIds is empty, pushes to all bound devices
 */
export const pushScheduleToDevices = (scheduleId: string, deviceIds: number[] | null = null) =>
  handleRequest(apiClient.post<BffResponse<SchedulePushResp>>(`/schedules/${scheduleId}/push`, deviceIds == null ? null : { deviceIds }));

/**
 * Get devices bound to this schedule
 */
export const getScheduleBindings = (scheduleId: string) =>
  handleRequest(apiClient.get<BffResponse<ScheduleBindingDeviceResp[]>>(`/schedules/${scheduleId}/bindings`));

/**
 * Bind devices to a schedule
 */
export const bindDevicesToSchedule = (scheduleId: string, deviceIds: number[], replaceExisting: boolean = false) =>
  handleRequest(apiClient.post<BffResponse<ScheduleBindDevicesResp>>(`/schedules/${scheduleId}/bindings`, { deviceIds, replaceExisting }));

/**
 * Unbind a device from a schedule
 */
export const unbindDeviceFromSchedule = (scheduleId: string, deviceId: number) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/schedules/${scheduleId}/bindings/${deviceId}/delete`));

/**
 * List schedule audit logs
 */
export const getScheduleAuditLogs = (scheduleId: string) =>
  handleRequest(apiClient.get<BffResponse<ScheduleAuditLogResp[]>>(`/schedules/${scheduleId}/audit-logs`));
