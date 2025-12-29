// Device Type Definitions for Prism Cloud Lite

import type { DeviceCustomFieldValues } from './device-custom-field';

export type DeviceStatus = 'pending' | 'online' | 'offline';
export type NetworkType = 'WiFi' | '4G' | 'Ethernet' | 'FOUR_G' | 'WIFI' | 'ETHERNET';

export interface Tag {
  id: string; // Mandatory for existing components
  name?: string; 
  slug?: string; 
  tagName: string;
  tagSlug: string;
  color: string;
  icon?: string;
  description?: string;
  isSystem?: boolean;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface DeviceLocation {
  lat: number;
  lng: number;
  source: 'reported' | 'manual';
  timestamp: string;
  accuracyM?: number;
}

export interface CurrentProgram {
  id: string;
  name: string;
  version: string;
}

export interface Device {
  // Primary IDs
  id: string; // compatibility (e.g. "device-001")
  deviceId: number; // backend real ID (e.g. 10001)
  
  // Basic Info
  deviceName: string;
  alias?: string; // compatibility
  description?: string;
  serialNumber?: string; // compatibility

  // Status mapping
  onlineStatus: number; // 1 for online, 0 for offline
  status: DeviceStatus; // compatibility ('online' | 'offline' | 'pending')
  
  // Timestamps
  onboardingTime: string;
  lastReportTime: string;
  createTime: string;
  offlineDuration?: number;

  // Hardware/Version
  model: string;
  version: string;
  firmwareVersion?: string; // compatibility
  resolution: Resolution | string; // backend may return string like "1024 x 512"

  // Network
  networkType: NetworkType;
  networkStrength?: number;
  signalStrength?: number; // compatibility
  ipAddress?: string;
  macAddress?: string;
  websocketStatus?: 'connected' | 'disconnected';

  // Display Control
  brightness: number;
  colorTemperature?: number;
  volume?: number;

  // Storage
  totalStorage: number;
  freeStorage: number;
  storageTotal?: number; // compatibility
  storageUsed?: number; // compatibility

  // Playback
  playingProgram?: string;
  currentProgram?: CurrentProgram; // compatibility

  // Screenshot
  lastScreenshotUrl?: string;
  latestScreenshot?: { url: string; timestamp: string }; // compatibility

  // Metadata
  tags: Tag[];
  customFieldValues?: Record<string, any>;
  
  // Location
  reportedLocation?: DeviceLocation;
  manualLocation?: DeviceLocation;
}

/**
 * Resolves the device status string based on backend onlineStatus and onboardingTime.
 * If onboardingTime is null/empty, the device is considered 'pending' (onboarding).
 * Otherwise, it follows the onlineStatus (1=online, 0=offline).
 */
export function resolveDeviceStatus(device: Device): DeviceStatus {
  if (!device.onboardingTime || device.onboardingTime === '') {
    return 'pending';
  }
  return device.onlineStatus === 1 ? 'online' : 'offline';
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
