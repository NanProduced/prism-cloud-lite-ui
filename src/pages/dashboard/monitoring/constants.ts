import {
  Thermometer,
  Droplets,
  Wind,
  Volume2,
  Flame,
  Sun,
  Zap,
  ToggleLeft,
  Cpu,
  type LucideIcon
} from 'lucide-react';
import type { SensorSourceType } from '@/services/telemetryApi';

// --- Source Type Definitions ---

export type MonitoringTab = 'device' | 'm2';

export interface SensorMapping {
  reportType: string;
  sensorIds: number[];
  sourceType: SensorSourceType;
  metricKeys?: string[];
  unit?: string;
  label: string;
}

export interface SensorGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  sensors: SensorMapping[];
  chartType: 'area' | 'line' | 'status' | 'drilldown';
  canCombine?: boolean; // Whether sensors can be shown in same chart
}

// --- SSE Item Routing ---

export function getSourceTab(sensorType: string, sensorId: number): MonitoringTab {
  // Receive card always goes to device tab
  if (sensorType === 'bitErrorRate') return 'device';
  // M2 sensors have sensorId >= 1000
  return sensorId >= 1000 ? 'm2' : 'device';
}

// --- Sensor ID to reportType Mapping (from telemetry.md) ---

export const SENSOR_ID_MAP: Record<number, { reportType: string; sourceType: SensorSourceType }> = {
  // DEVICE_SENSOR
  0: { reportType: 'bright', sourceType: 'DEVICE_SENSOR' },
  1: { reportType: 'noise', sourceType: 'DEVICE_SENSOR' },
  2: { reportType: 'temperature', sourceType: 'DEVICE_SENSOR' }, // also humidity
  3: { reportType: 'smoke', sourceType: 'DEVICE_SENSOR' },
  4: { reportType: 'pm10', sourceType: 'DEVICE_SENSOR' }, // also pm25
  6: { reportType: 'temperatureOnBoard', sourceType: 'DEVICE_SENSOR' },
  7: { reportType: 'humidityOnBoard', sourceType: 'DEVICE_SENSOR' },

  // M2_SENSOR
  1000: { reportType: 'bright', sourceType: 'M2_SENSOR' },
  1001: { reportType: 'noise', sourceType: 'M2_SENSOR' },
  1002: { reportType: 'temperature', sourceType: 'M2_SENSOR' }, // also humidity
  1003: { reportType: 'smoke', sourceType: 'M2_SENSOR' },
  1004: { reportType: 'pm10', sourceType: 'M2_SENSOR' }, // also pm25
  2002: { reportType: 'temperatureOnBoard', sourceType: 'M2_SENSOR' }, // also humidityOnBoard
  9999: { reportType: 'voltage', sourceType: 'M2_SENSOR' }, // also electromagnetic, relay*
};

// --- Device Tab Sensor Groups ---

export const DEVICE_TAB_GROUPS: SensorGroup[] = [
  {
    id: 'receiveCard',
    title: 'Receive Cards',
    icon: Cpu,
    chartType: 'drilldown',
    sensors: [
      {
        reportType: 'bitErrorRate',
        sensorIds: [],
        sourceType: 'DEVICE_SENSOR',
        label: 'Receive Card Health',
      },
    ],
  },
  {
    id: 'climate',
    title: 'Climate',
    icon: Thermometer,
    chartType: 'area',
    canCombine: true,
    sensors: [
      {
        reportType: 'temperature',
        sensorIds: [2],
        sourceType: 'DEVICE_SENSOR',
        unit: '°C',
        label: 'Temperature',
      },
      {
        reportType: 'temperatureOnBoard',
        sensorIds: [6],
        sourceType: 'DEVICE_SENSOR',
        unit: '°C',
        label: 'Board Temp',
      },
      {
        reportType: 'humidity',
        sensorIds: [2],
        sourceType: 'DEVICE_SENSOR',
        unit: '%',
        label: 'Humidity',
      },
      {
        reportType: 'humidityOnBoard',
        sensorIds: [7],
        sourceType: 'DEVICE_SENSOR',
        unit: '%',
        label: 'Board Humidity',
      },
    ],
  },
  {
    id: 'airQuality',
    title: 'Air Quality',
    icon: Wind,
    chartType: 'area',
    canCombine: false,
    sensors: [
      {
        reportType: 'pm10',
        sensorIds: [4],
        sourceType: 'DEVICE_SENSOR',
        unit: 'μg/m³',
        label: 'PM10',
      },
      {
        reportType: 'pm25',
        sensorIds: [4],
        sourceType: 'DEVICE_SENSOR',
        unit: 'μg/m³',
        label: 'PM2.5',
      },
      {
        reportType: 'smoke',
        sensorIds: [3],
        sourceType: 'DEVICE_SENSOR',
        unit: 'ppm',
        label: 'Smoke',
      },
      {
        reportType: 'noise',
        sensorIds: [1],
        sourceType: 'DEVICE_SENSOR',
        unit: 'dB',
        label: 'Noise',
      },
    ],
  },
  {
    id: 'brightness',
    title: 'Brightness',
    icon: Sun,
    chartType: 'area',
    sensors: [
      {
        reportType: 'bright',
        sensorIds: [0],
        sourceType: 'DEVICE_SENSOR',
        metricKeys: ['sensorBrightValue'],
        unit: 'lux',
        label: 'Ambient Light',
      },
    ],
  },
];

// --- M2 Tab Sensor Groups ---

export const M2_TAB_GROUPS: SensorGroup[] = [
  {
    id: 'climate',
    title: 'Climate',
    icon: Thermometer,
    chartType: 'area',
    canCombine: true,
    sensors: [
      {
        reportType: 'temperature',
        sensorIds: [1002],
        sourceType: 'M2_SENSOR',
        unit: '°C',
        label: 'Temperature',
      },
      {
        reportType: 'temperatureOnBoard',
        sensorIds: [2002],
        sourceType: 'M2_SENSOR',
        unit: '°C',
        label: 'Board Temp',
      },
      {
        reportType: 'humidity',
        sensorIds: [1002],
        sourceType: 'M2_SENSOR',
        unit: '%',
        label: 'Humidity',
      },
      {
        reportType: 'humidityOnBoard',
        sensorIds: [2002],
        sourceType: 'M2_SENSOR',
        unit: '%',
        label: 'Board Humidity',
      },
    ],
  },
  {
    id: 'airQuality',
    title: 'Air Quality',
    icon: Wind,
    chartType: 'area',
    canCombine: false,
    sensors: [
      {
        reportType: 'pm10',
        sensorIds: [1004],
        sourceType: 'M2_SENSOR',
        unit: 'μg/m³',
        label: 'PM10',
      },
      {
        reportType: 'pm25',
        sensorIds: [1004],
        sourceType: 'M2_SENSOR',
        unit: 'μg/m³',
        label: 'PM2.5',
      },
      {
        reportType: 'smoke',
        sensorIds: [1003],
        sourceType: 'M2_SENSOR',
        unit: 'ppm',
        label: 'Smoke',
      },
      {
        reportType: 'noise',
        sensorIds: [1001],
        sourceType: 'M2_SENSOR',
        unit: 'dB',
        label: 'Noise',
      },
    ],
  },
  {
    id: 'brightness',
    title: 'Brightness',
    icon: Sun,
    chartType: 'line',
    canCombine: true,
    sensors: [
      {
        reportType: 'bright',
        sensorIds: [1000],
        sourceType: 'M2_SENSOR',
        metricKeys: ['masterBrightValue', 'screenBrightValue'],
        unit: '',
        label: 'Screen Brightness',
      },
    ],
  },
  {
    id: 'power',
    title: 'Power',
    icon: Zap,
    chartType: 'line',
    canCombine: true,
    sensors: [
      {
        reportType: 'voltage',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        unit: 'V',
        label: 'Voltage',
      },
      {
        reportType: 'voltage2',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        unit: 'V',
        label: 'Voltage 2',
      },
      {
        reportType: 'electromagnetic',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        unit: '',
        label: 'EM Door',
      },
    ],
  },
  {
    id: 'relay',
    title: 'Relay Control',
    icon: ToggleLeft,
    chartType: 'status',
    sensors: [
      {
        reportType: 'relayStatus',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        label: 'Relay 1',
      },
      {
        reportType: 'relayStatus2',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        label: 'Relay 2',
      },
      {
        reportType: 'relayStatus3',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        label: 'Relay 3',
      },
      {
        reportType: 'relayDelay',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        unit: 'ms',
        label: 'Delay 1',
      },
      {
        reportType: 'relayDelay2',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        unit: 'ms',
        label: 'Delay 2',
      },
      {
        reportType: 'relayDelay3',
        sensorIds: [9999],
        sourceType: 'M2_SENSOR',
        unit: 'ms',
        label: 'Delay 3',
      },
    ],
  },
];

// --- Chart Colors ---

export const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#ec4899',
  tertiary: '#10b981',
  quaternary: '#f59e0b',
  temperature: '#ef4444',
  humidity: '#3b82f6',
  smoke: '#f97316',
  noise: '#8b5cf6',
  pm: '#06b6d4',
  voltage: '#eab308',
  brightness: '#fbbf24',
};

// --- Thresholds for Alerts ---

export const ALERT_THRESHOLDS = {
  temperature: { warning: 40, critical: 50 },
  humidity: { warning: 80, critical: 90 },
  smoke: { warning: 50, critical: 100 },
  noise: { warning: 85, critical: 100 },
  pm10: { warning: 150, critical: 250 },
  pm25: { warning: 75, critical: 150 },
};
