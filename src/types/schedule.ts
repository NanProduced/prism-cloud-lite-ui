// Schedule Type Definitions for Prism Cloud Lite
// Aligned with backend business logic (pc_schedule, pc_schedule_contents_rule, etc.)

export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface ScheduleLimitTime {
  start: string; // HH:mm:ss
  end: string;   // HH:mm:ss
}

export interface ScheduleLimitDate {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export type ContentsScheduleType = 'rotation' | 'spot';

/**
 * Represents a single rule for a program within a schedule.
 * Maps to pc_schedule_contents_rule
 */
export interface ProgramScheduleRule {
  id: string;
  type: ContentsScheduleType;
  priority: number;
  
  // Link to a specific release (program version)
  // On device side, this is the integer 'programId'
  releaseProgramId: number; 
  programId: string; // UUID of the program
  programName: string;
  version: number;

  // Limits
  ifLimitTime: boolean;
  limitTime?: ScheduleLimitTime | null;
  
  ifLimitDate: boolean;
  limitDate?: ScheduleLimitDate | null;
  
  ifLimitWeekday: boolean;
  limitWeekday?: WeekDay[] | null;
}

/**
 * Represents a single command rule within a schedule.
 * Maps to pc_schedule_command_rule
 */
export interface CommandScheduleRule {
  id: string;
  name: string; // Action name like 'Brightness_Control'
  operation?: string; // Backend DTO alignment (DeviceActionBase)
  payloadJson: string; // Raw JSON string for terminal
  
  // Limits
  ifLimitTime: boolean;
  limitTime?: ScheduleLimitTime | null;
  
  ifLimitDate: boolean;
  limitDate?: ScheduleLimitDate | null;
  
  ifLimitWeekday: boolean;
  limitWeekday?: WeekDay[] | null;
}

/**
 * A Schedule is a collection of program and command rules.
 * Maps to pc_schedule
 */
export interface ScheduleRecord {
  id: string;
  name: string; // "Playback Plan Name"
  description?: string;
  enabled: boolean;
  timezone: string; // e.g., 'Asia/Shanghai', 'UTC'
  createdAt: string;
  updatedAt: string;
  
  // Observability
  lastPushedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'failed' | 'partial';

  // Rules
  programRules: ProgramScheduleRule[];
  commandRules: CommandScheduleRule[];
  
  // Stats for list view
  boundDeviceCount: number;
}

/**
 * Represents the link between a device and a schedule.
 * Maps to pc_device_schedule_binding
 */
export interface ScheduleBinding {
  deviceId: string;
  scheduleId: string;
  boundAt: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string;
  errorMessage?: string;
}

/**
 * Combined data for device visibility (AllowList)
 * Used in Device Details -> Playback Plan
 */
export interface DeviceProgramVisibility {
  programId: string;
  programName: string;
  version: number;
  releaseProgramId: number;
  source: 'direct' | 'schedule';
  scheduleId?: string;
  scheduleName?: string;
  
  // Fact: is it actually on the device?
  status: 'unknown' | 'downloading' | 'downloaded';
  progress?: number;
}