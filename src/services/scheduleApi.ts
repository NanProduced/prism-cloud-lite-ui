import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { 
  ScheduleRecord, 
  CreateScheduleReq, 
  UpdateScheduleReq,
  ScheduleBindingDevice,
  SchedulePushResp
} from '@/types/schedule';

/**
 * Get all playback schedules for current user
 */
export const getSchedules = () =>
  handleRequest(apiClient.get<BffResponse<ScheduleRecord[]>>('/schedules'));

/**
 * Get single schedule details including rules
 */
export const getScheduleDetails = (scheduleId: string) =>
  handleRequest(apiClient.get<BffResponse<ScheduleRecord>>(`/schedules/${scheduleId}`));

/**
 * Create a new schedule
 */
export const createSchedule = (data: CreateScheduleReq) =>
  handleRequest(apiClient.post<BffResponse<ScheduleRecord>>('/schedules', data));

/**
 * Update schedule rules or metadata
 * Note: contentsRules/commandRules follow 'replace' semantics if not null
 */
export const updateSchedule = (scheduleId: string, data: UpdateScheduleReq) =>
  handleRequest(apiClient.post<BffResponse<ScheduleRecord>>(`/schedules/${scheduleId}`, data));

/**
 * Delete a schedule
 */
export const deleteSchedule = (scheduleId: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/schedules/${scheduleId}/delete`));

/**
 * Push schedule updates to hardware terminals
 * If deviceIds is empty, pushes to all bound devices
 */
export const pushScheduleToDevices = (scheduleId: string, deviceIds: string[] = []) =>
  handleRequest(apiClient.post<BffResponse<SchedulePushResp>>(`/schedules/${scheduleId}/push`, { deviceIds }));

/**
 * Get devices bound to this schedule
 */
export const getScheduleBindings = (scheduleId: string) =>
  handleRequest(apiClient.get<BffResponse<ScheduleBindingDevice[]>>(`/schedules/${scheduleId}/bindings`));

/**
 * Bind devices to a schedule
 */
export const bindDevicesToSchedule = (scheduleId: string, deviceIds: string[], replaceExisting: boolean = true) =>
  handleRequest(apiClient.post<BffResponse<any>>(`/schedules/${scheduleId}/bindings`, { deviceIds, replaceExisting }));
