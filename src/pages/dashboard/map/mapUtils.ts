import type { Device, DeviceLocation, DeviceStatus } from "@/types/device";
import type { LocationMode } from "./mapTypes";

export const STATUS_ORDER: DeviceStatus[] = ["online", "offline", "pending"];

export const INTERACTIVE_LAYER_IDS = ["device-points", "device-clusters"] as const;

export function getTimeRangePresets(t: any) {
  return [
    { value: "1h", label: t('map.presets.timeRange.1h') },
    { value: "24h", label: t('map.presets.timeRange.24h') },
    { value: "7d", label: t('map.presets.timeRange.7d') },
    { value: "30d", label: t('map.presets.timeRange.30d') },
  ] as const;
}

export function getStatusLabel(status: DeviceStatus, t: any) {
  switch (status) {
    case "online":
      return t('devices.stats.online');
    case "offline":
      return t('devices.stats.offline');
    case "pending":
      return t('devices.stats.pending');
    default:
      return status;
  }
}

export function getStatusBadgeClassName(status: DeviceStatus) {
  switch (status) {
    case "online":
      return "bg-emerald-600/10 text-emerald-700 border-emerald-600/20";
    case "offline":
      return "bg-slate-600/10 text-slate-700 border-slate-600/20";
    case "pending":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function resolveDeviceLocation(device: Device, mode: LocationMode) {
  if (mode === "reported") return device.reportedLocation;
  if (mode === "manual") return device.manualLocation;
  return device.manualLocation ?? device.reportedLocation;
}

export function formatLocation(location: DeviceLocation) {
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

export function getDefaultCenter(devices: Device[], mode: LocationMode) {
  const firstWithLocation = devices.find((device) => resolveDeviceLocation(device, mode));
  if (!firstWithLocation) return { longitude: 121.4737, latitude: 31.2304, zoom: 3.5 };
  const location = resolveDeviceLocation(firstWithLocation, mode)!;
  return { longitude: location.lng, latitude: location.lat, zoom: 8 };
}

export function getBoundsFromPoints(points: Array<{ lng: number; lat: number }>) {
  if (points.length === 0) return null;
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ] as [[number, number], [number, number]];
}

export function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

