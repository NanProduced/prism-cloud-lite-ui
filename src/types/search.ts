import type { DeviceStatus } from "./device";

export interface SearchDeviceResult {
  id: number;
  name: string;
  serialNo?: string;
  ip?: string;
  status: DeviceStatus | 'unknown';
  model?: string;
}

export interface SearchProgramResult {
  id: string;
  name: string;
  resolution: string;
  updatedAt: string;
}

export interface SearchMediaResult {
  id: string;
  title: string;
  kind: 'image' | 'video' | 'document' | 'other';
  size: number;
  thumbnailUrl?: string;
}

export interface SearchData {
  devices?: SearchDeviceResult[];
  programs?: SearchProgramResult[];
  media?: SearchMediaResult[];
}

export interface SearchParams {
  q: string;
  types?: string; // comma separated: device, program, media
  limit?: number;
}
