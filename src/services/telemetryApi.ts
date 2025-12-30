import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';

// --- GPS Telemetry ---

export interface GpsPoint {
  deviceId: string | number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  direct?: number;
  satellites?: number;
  source: 'reported' | 'manual';
  timestamp: string; // serverTime (UTC)
}

export interface GpsDeviceLocationItem {
  deviceId: string | number;
  reported?: GpsPoint;
  manual?: GpsPoint;
}

export interface GpsTrackParams {
  deviceId: string | number;
  from?: string; // ISO-8601
  to?: string;
  limit?: number;
}

export interface GpsHeatmapParams {
  from?: string;
  to?: string;
  precision?: number; // 2-4
  limit?: number;
}

export const getGpsLatest = () =>
  handleRequest(apiClient.get<BffResponse<GpsDeviceLocationItem[]>>('/telemetry/gps/latest'));

export const getGpsTrack = (params: GpsTrackParams) =>
  handleRequest(apiClient.get<BffResponse<GpsPoint[]>>('/telemetry/gps/track', { params }));

export const getGpsHeatmap = (params: GpsHeatmapParams) =>
  handleRequest(apiClient.get<BffResponse<any>>('/telemetry/gps/heatmap', { params }));

export const setGpsOverride = (deviceId: string | number, lat: number, lng: number) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/telemetry/gps/overrides/${deviceId}`, { latitude: lat, longitude: lng }));

export const deleteGpsOverride = (deviceId: string | number) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/telemetry/gps/overrides/${deviceId}/delete`));

// --- Sensor Telemetry ---

// 数据源类型：RECEIVE_CARD 为接收卡独立数据源
export type SensorSourceType = 'DEVICE_SENSOR' | 'M2_SENSOR' | 'RECEIVE_CARD';

export interface SensorSeriesParams {
  deviceId: string | number;
  from?: string;
  to?: string;
  sourceType?: SensorSourceType;
  reportTypes?: string[];
  metricKeys?: string[];
  limit?: number;
}

export interface SensorDataPoint {
  at: string; // UTC
  value: number;
  reportType: string;
  sourceType: SensorSourceType;
  metricKey: string;
}

export const getSensorSeries = (params: SensorSeriesParams) =>
  handleRequest(apiClient.get<BffResponse<SensorDataPoint[]>>('/telemetry/sensors/series', { params }));

// --- Receiving Card Telemetry ---

export interface ReceiveCardSampleParams {
  deviceId: string | number;
  from?: string;
  to?: string;
  netPortNum?: number;
  receiveCardNum?: number;
  limit?: number;
}

export interface ReceiveCardSample {
  at: string;
  netPortNum: number;
  receiveCardNum: number;
  bitErrorRate: number;
  temperature: number;
  humidity: number;
  smoke: number;
  x?: number;
  y?: number;
}

export const getReceiveCardSamples = (params: ReceiveCardSampleParams) =>
  handleRequest(apiClient.get<BffResponse<ReceiveCardSample[]>>('/telemetry/receive-cards/samples', { params }));

// --- Playback Telemetry ---

export type PlaybackBucket = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface PlaybackOverviewParams {
  from: string;
  to: string;
  top?: number;
  sort?: 'playSeconds' | 'playCount';
}

export interface PlaybackSummaryItem {
  id: string;
  name: string;
  playCount: number;
  playSeconds: number;
  version?: string;
}

export interface PlaybackOverviewResponse {
  totalCount: number;
  totalSeconds: number;
  topPrograms: PlaybackSummaryItem[];
  topMedia: PlaybackSummaryItem[];
}

export const getPlaybackOverview = (params: PlaybackOverviewParams) =>
  handleRequest(apiClient.get<BffResponse<PlaybackOverviewResponse>>('/telemetry/playback/overview', { params }));

// --- Playback Summary (榜单) ---

export interface PlaybackSummaryParams {
  from: string;
  to: string;
  limit?: number;
  offset?: number;
  sort?: 'playSeconds' | 'playCount';
}

export interface ProgramSummaryItem {
  programId: string;
  name: string;
  version: string;
  playCount: number;
  playSeconds: number;
  deviceCount: number;
  isLan: boolean;  // LAN节目标记
}

export interface MediaSummaryItem {
  mediaId: string;
  name: string;
  type: string;  // image/video/etc
  playCount: number;
  playSeconds: number;
  deviceCount: number;
}

export interface ProgramSummaryResponse {
  items: ProgramSummaryItem[];
  total: number;
}

export interface MediaSummaryResponse {
  items: MediaSummaryItem[];
  total: number;
}

// 节目榜单
export const getProgramsSummary = (params: PlaybackSummaryParams) =>
  handleRequest(apiClient.get<BffResponse<ProgramSummaryResponse>>('/telemetry/playback/programs/summary', { params }));

// 素材榜单
export const getMediaSummary = (params: PlaybackSummaryParams) =>
  handleRequest(apiClient.get<BffResponse<MediaSummaryResponse>>('/telemetry/playback/media/summary', { params }));



export const getProgramPlaybackBuckets = (params: { 

  programId: string; 

  version: string; 

  from: string; 

  to: string; 

  tz: string; 

  bucket: PlaybackBucket 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/playback/programs/${params.programId}/versions/${params.version}/buckets`, { params }));



export const getMediaPlaybackBuckets = (params: { 

  mediaId: string; 

  from: string; 

  to: string; 

  tz: string; 

  bucket: PlaybackBucket 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/playback/media/${params.mediaId}/buckets`, { params }));



export const getProgramPlaybackDevices = (params: { 

  programId: string; 

  version: string; 

  from: string; 

  to: string; 

  limit?: number; 

  sort?: string 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/playback/programs/${params.programId}/versions/${params.version}/devices`, { params }));



export const getMediaPlaybackDevices = (params: { 

  mediaId: string; 

  from: string; 

  to: string; 

  limit?: number; 

  sort?: string 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/playback/media/${params.mediaId}/devices`, { params }));



// --- Online Time Telemetry ---



export interface OnlineTimeSummaryItem {

  deviceId: string;

  onlineSeconds: number;

  offlineSeconds: number;

  onlineRate: number; // 0-1

}



export const getOnlineTimeSummary = (params: { from: string; to: string }) =>

  handleRequest(apiClient.get<BffResponse<OnlineTimeSummaryItem[]>>('/telemetry/online-time/devices/summary', { params }));



export const getActiveDeviceCountBuckets = (params: { 

  from: string; 

  to: string; 

  tz: string; 

  bucket: PlaybackBucket 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>('/telemetry/online-time/devices/active-count/buckets', { params }));



export const getConcurrencyBuckets = (params: { 

  from: string; 

  to: string; 

  tz: string; 

  bucket: PlaybackBucket 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>('/telemetry/online-time/devices/concurrency/buckets', { params }));



export const getDeviceOnlineBuckets = (params: { 

  deviceId: string; 

  from: string; 

  to: string; 

  tz: string; 

  bucket: PlaybackBucket 

}) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/online-time/devices/${params.deviceId}/buckets`, { params }));



export const getDeviceSessionStats = (params: { deviceId: string; from: string; to: string }) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/online-time/devices/${params.deviceId}/session-stats`, { params }));



export const getDeviceOfflineGapStats = (params: { deviceId: string; from: string; to: string }) =>

  handleRequest(apiClient.get<BffResponse<any>>(`/telemetry/online-time/devices/${params.deviceId}/offline-gap-stats`, { params }));



export interface DeviceSession {

  sessionId: string;

  startTime: string;

  endTime: string;

  durationSeconds: number;

}



export const getDeviceSessions = (params: { 

  deviceId: string; 

  from: string; 

  to: string; 

  limit?: number; 

  cursor?: string 

}) =>

  handleRequest(apiClient.get<BffResponse<{ items: DeviceSession[], nextCursor?: string }>>(`/telemetry/online-time/devices/${params.deviceId}/sessions`, { params }));
