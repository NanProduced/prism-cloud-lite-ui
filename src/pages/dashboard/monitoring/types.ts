import type { SensorSourceType } from '@/services/telemetryApi';

// --- SSE Real-time Data Types ---

export interface TelemetryItem {
  sensorType: string;
  sensorId: number;
  date?: string;
  sensorValue?: any;
  // Brightness specific
  masterBrightValue?: number;
  screenBrightValue?: number;
  sensorBrightValue?: number;
  // Receive card specific (nested array in sensorValue)
  deviceId?: string;
  [key: string]: any;
}

export interface RealtimeMetric {
  value: any;
  at: string;
  sourceType: SensorSourceType;
  reportType: string;
  metricKey: string;
  deviceId: string;
  history: { at: string; val: number }[];
  traceId?: string;
}

export interface SSEState {
  metrics: Record<string, RealtimeMetric>; // key: `${sourceType}:${reportType}:${deviceId}`
  lastUpdate: number;
  status: 'connected' | 'reconnecting' | 'error' | 'idle';
  diagnostics: { traceId: string; occurredAt: string }[];
}

// --- Receive Card Types ---

export interface ReceiveCardData {
  netPortNum: number;
  receiveCardNum: number;
  bitErrorRate: number;
  temperature: number;
  humidity: number;
  smoke: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ReceiveCardPortData {
  netPortNum: number;
  receiveCards: ReceiveCardData[];
}

// --- Chart Data Types ---

export interface ChartDataPoint {
  at: string;
  value: number;
  [key: string]: any;
}

export interface MultiLineChartData {
  at: string;
  [metricKey: string]: number | string;
}

// --- Component Props ---

export interface SensorCardProps {
  deviceIds: string[];
  metrics: Record<string, RealtimeMetric>;
  onViewHistory?: (reportType: string, metricKeys?: string[]) => void;
}

export interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  deviceId: string;
  reportType: string;
  sourceType: SensorSourceType;
  metricKeys?: string[];
  title: string;
  // Receive card specific
  isReceiveCard?: boolean;
  netPortNum?: number;
  receiveCardNum?: number;
}

// --- Filter Types ---

export interface MonitoringFilters {
  activeTab: 'device' | 'm2';
  selectedDeviceIds: string[];
  visibleGroups: string[];
}
