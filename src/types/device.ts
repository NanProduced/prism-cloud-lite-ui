// Device Type Definitions for Prism Cloud Lite

import type { DeviceCustomFieldValues } from './device-custom-field';

export type DeviceStatus = 'pending' | 'online' | 'offline';
export type NetworkType = 'WiFi' | '4G' | 'Ethernet' | 'FOUR_G' | 'WIFI' | 'ETHERNET';

export interface Tag {
  tagName: string;
  tagSlug: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface Device {
  deviceId: number;
  deviceName: string;
  description?: string;
  onlineStatus: number; // 1 for online, 0 for offline, etc.
  onboardingTime: string;
  lastReportTime: string;
  createTime: string;
  model: string;
  version: string;
  brightness: number;
  networkType: NetworkType;
  networkStrength?: number;
  playingProgram?: string;
  resolution: string;
  totalStorage: number;
  freeStorage: number;
  lastScreenshotUrl?: string;
  tags: Tag[];
  customFieldValues?: Record<string, any>;
}

// Filter Condition Types
export type FilterOperator =
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'lt'      // less than
  | 'gte'     // greater than or equal
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'contains'// string contains
  | 'between';// between two values

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

// Command Types
export type CommandType =
  | 'wake'
  | 'sleep'
  | 'reboot'
  | 'screenshot'
  | 'brightness'
  | 'volume'
  | 'colorTemperature'
  | 'syncProgram';

export type CommandStatus = 'pending' | 'running' | 'success' | 'failed';

export interface Command {
  id: string;
  type: CommandType;
  targetDevices: string[]; // device IDs
  params?: Record<string, any>;
  status: CommandStatus;
  createdAt: string;
  executedAt?: string;
  result?: {
    success: number;
    failed: number;
    details: Array<{
      deviceId: string;
      status: 'success' | 'failed';
      error?: string;
      duration?: number; // ms
    }>;
  };
}
