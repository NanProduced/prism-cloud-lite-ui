import type { SensorSourceType } from "@/services/telemetryApi";

/**
 * Maps raw sensor telemetry data from devices to platform-standard report types and sources.
 * Based on docs/integration/telemetry.md
 */

export interface ResolvedSensorInfo {
  sourceType: SensorSourceType;
  reportType: string;
  label: string;
}

export function resolveSensorInfo(sensorType: string, sensorId: number): ResolvedSensorInfo {
  // Special case: Receiving Card
  if (sensorType === 'bitErrorRate') {
    return {
      sourceType: 'DEVICE_SENSOR',
      reportType: 'bitErrorRate',
      label: 'Receive Card',
    };
  }

  // Determine Source Type
  const sourceType: SensorSourceType = sensorId >= 1000 ? 'M2_SENSOR' : 'DEVICE_SENSOR';

  // Mapping Table (reportType / label)
  const mappings: Record<string, Record<number, { reportType: string; label: string }>> = {
    bright: {
      0: { reportType: 'bright', label: 'Ambient Light' },
      1000: { reportType: 'bright', label: 'Screen Brightness' },
    },
    noise: {
      1: { reportType: 'noise', label: 'Noise Level' },
      1001: { reportType: 'noise', label: 'M2 Noise' },
    },
    humidity: {
      2: { reportType: 'humidity', label: 'Humidity' },
      1002: { reportType: 'humidity', label: 'M2 Humidity' },
      7: { reportType: 'humidityOnBoard', label: 'A20 On-board Humidity' },
      2002: { reportType: 'humidityOnBoard', label: 'M2 On-board Humidity' },
    },
    temperature: {
      2: { reportType: 'temperature', label: 'Temperature' },
      1002: { reportType: 'temperature', label: 'M2 Temperature' },
      6: { reportType: 'temperatureOnBoard', label: 'A20 On-board Temperature' },
      2002: { reportType: 'temperatureOnBoard', label: 'M2 On-board Temperature' },
    },
    smoke: {
      3: { reportType: 'smoke', label: 'Smoke' },
      1003: { reportType: 'smoke', label: 'M2 Smoke' },
    },
    pm10: {
      4: { reportType: 'pm10', label: 'PM10' },
      1004: { reportType: 'pm10', label: 'M2 PM10' },
    },
    pm25: {
      4: { reportType: 'pm25', label: 'PM2.5' },
      1004: { reportType: 'pm25', label: 'M2 PM2.5' },
    },
    electromagnetic: {
      9999: { reportType: 'electromagnetic', label: 'Electromagnetic' },
    },
    voltage: {
      9999: { reportType: 'voltage', label: 'Voltage' },
    },
    voltage2: {
      9999: { reportType: 'voltage2', label: 'Voltage 2' },
    },
    relayStatus: { 9999: { reportType: 'relayStatus', label: 'Relay 1 Status' } },
    relayStatus2: { 9999: { reportType: 'relayStatus2', label: 'Relay 2 Status' } },
    relayStatus3: { 9999: { reportType: 'relayStatus3', label: 'Relay 3 Status' } },
    relayDelay: { 9999: { reportType: 'relayDelay', label: 'Relay 1 Delay' } },
    relayDelay2: { 9999: { reportType: 'relayDelay2', label: 'Relay 2 Delay' } },
    relayDelay3: { 9999: { reportType: 'relayDelay3', label: 'Relay 3 Delay' } },
  };

  const typeMap = mappings[sensorType];
  const info = typeMap ? typeMap[sensorId] : null;

  if (info) {
    return {
      sourceType,
      reportType: info.reportType,
      label: info.label,
    };
  }

  // Fallback for unknown sensors
  return {
    sourceType,
    reportType: sensorType,
    label: sensorType.charAt(0).toUpperCase() + sensorType.slice(1),
  };
}

/**
 * Formats a sensor value with its appropriate unit
 */
export function formatSensorValue(value: number | any, reportType: string): string {
  if (typeof value !== 'number') return String(value);

  const units: Record<string, string> = {
    temperature: '°C',
    temperatureOnBoard: '°C',
    humidity: '%',
    humidityOnBoard: '%',
    bright: ' lux',
    noise: ' dB',
    pm25: ' μg/m³',
    pm10: ' μg/m³',
    voltage: 'V',
    voltage2: 'V',
    bitErrorRate: '',
  };

  const unit = units[reportType] || '';
  
  if (reportType === 'bitErrorRate') {
     return value.toFixed(6);
  }

  return `${value}${unit}`;
}
