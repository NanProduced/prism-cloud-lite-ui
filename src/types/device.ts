// Device Type Definitions for Prism Cloud Lite

export type DeviceStatus = 'pending' | 'online' | 'offline';
export type NetworkType = 'WiFi' | '4G' | 'Ethernet';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  // Either a hex color like "#3b82f6" or a preset key like "slate"/"sky".
  color: string;
  // Optional lucide icon name (e.g. "MapPin", "Store"). Not all tags need an icon.
  icon?: string;
  description?: string;
  // Reserved for future: system auto-tags vs user-defined tags.
  // Lite UI currently treats all tags as user-defined.
  isSystem: boolean;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface CurrentProgram {
  id: string;
  name: string;
  version: string;
}

export interface Screenshot {
  url: string;
  timestamp: string;
}

export interface Device {
  id: string;
  deviceName: string;
  alias?: string;
  serialNumber?: string;

  // Status
  status: DeviceStatus;
  lastReportTime: string;
  onboardingTime: string;
  offlineDuration?: number; // seconds

  // Hardware Info
  model: string;
  firmwareVersion: string;
  resolution: Resolution;

  // Network
  networkType: NetworkType;
  websocketStatus: 'connected' | 'disconnected';
  ipAddress?: string;
  macAddress?: string;
  signalStrength?: number; // 0-100

  // Display Control
  brightness: number; // 0-100
  colorTemperature?: number; // 2000-6500K
  volume: number; // 0-100

  // Storage
  storageUsed: number; // bytes
  storageTotal: number; // bytes

  // Current Program
  currentProgram?: CurrentProgram;

  // Tags
  tags: Tag[];

  // Custom Fields (for future extensibility)
  customFields?: Record<string, any>;

  // Screenshot
  latestScreenshot?: Screenshot;
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
