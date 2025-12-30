import type { PlaybackBucket } from '@/services/telemetryApi';

export type AnalyticsTab = 'overview' | 'online-time' | 'playback';

export interface TimeRangeState {
  from: string;
  to: string;
}

export interface PlaybackKPIData {
  totalCount: number;
  totalSeconds: number;
  deviceCount: number;
}

export interface TopPlaybackItem {
  id: string;
  name: string;
  version?: string;
  playCount: number;
  playSeconds: number;
}

export interface PlaybackBucketData {
  bucketStart: string;
  bucketEnd: string;
  playCount: number;
  playSeconds: number;
}

export interface DevicePlaybackItem {
  deviceId: string;
  playCount: number;
  playSeconds: number;
}

export interface OnlineSummaryItem {
  deviceId: string;
  onlineSeconds: number;
  onlineRate: number;
}

export interface DeviceSession {
  sessionId: string;
  deviceId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

export interface SessionStats {
  totalSessions: number;
  avgDurationSeconds: number;
  maxDurationSeconds: number;
  minDurationSeconds: number;
}

export interface OfflineGapStats {
  totalGaps: number;
  avgGapSeconds: number;
  maxGapSeconds: number;
  minGapSeconds: number;
}

export interface AnalyticsFilters {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  sort: 'playSeconds' | 'playCount';
}
