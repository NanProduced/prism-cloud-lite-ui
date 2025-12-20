// Schedule Type Definitions for Prism Cloud Lite

export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface TimeRange {
  start: string; // HH:mm:ss
  end: string;   // HH:mm:ss
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export type ContentsScheduleType = 'rotation' | 'spot';

export interface ContentsSchedule {
  id: string;
  programId: string;
  programName: string;
  type: ContentsScheduleType;
  priority: number;
  dateRange: DateRange;
  weekDays: WeekDay[];
  timeRange: TimeRange;
}

export type CommandScheduleAction = 
  | 'Brightness_Control'
  | 'Volume_Control'
  | 'Colortemp_Control'
  | 'Sleep'
  | 'Wakeup'
  | 'Reboot'
  | 'Clear_Cache'
  | 'Switch_Signal_Source'
  | 'Relay'
  | 'Board_Relay';

export interface CommandSchedule {
  id: string;
  name: CommandScheduleAction;
  params: Record<string, any>;
  dateRange: DateRange;
  weekDays: WeekDay[];
  timeRange: TimeRange;
}

export interface SchedulePolicy {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  deviceCount: number;
  contents: ContentsSchedule[];
  commands: CommandSchedule[];
}
