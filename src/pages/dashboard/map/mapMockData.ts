import type { Device } from "@/types/device";
import type { HeatmapFeatureCollection, LocationMode, TimeRangePreset, TracksFeatureCollection } from "./mapTypes";
import { resolveDeviceLocation } from "./mapUtils";

const COLOR_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#e11d48",
] as const;

const HEATMAP_POINTS_PER_DEVICE: Record<TimeRangePreset, number> = {
  "1h": 6,
  "24h": 10,
  "7d": 14,
  "30d": 20,
};

const TRACK_BASE_POINTS: Record<TimeRangePreset, number> = {
  "1h": 70,
  "24h": 120,
  "7d": 170,
  "30d": 220,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashStringToInt(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function offsetByMeters(lng: number, lat: number, eastM: number, northM: number) {
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = metersPerDegLat * Math.cos(latRad);
  const nextLat = lat + northM / metersPerDegLat;
  const nextLng = lng + eastM / Math.max(1e-6, metersPerDegLng);
  return { lng: nextLng, lat: nextLat };
}

function chaikinSmooth(coords: Array<[number, number]>, iterations: number) {
  let result = coords;
  for (let iter = 0; iter < iterations; iter++) {
    if (result.length < 3) return result;
    const next: Array<[number, number]> = [result[0]];
    for (let i = 0; i < result.length - 1; i++) {
      const [x0, y0] = result[i];
      const [x1, y1] = result[i + 1];
      next.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1]);
      next.push([0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    next.push(result[result.length - 1]);
    result = next;
  }
  return result;
}

export function getDeviceColor(deviceId: string) {
  const idx = hashStringToInt(deviceId) % COLOR_PALETTE.length;
  return COLOR_PALETTE[idx] ?? COLOR_PALETTE[0];
}

export function buildHeatmapPoints(
  devices: Device[],
  mode: LocationMode,
  timeRange: TimeRangePreset,
): HeatmapFeatureCollection {
  const features: HeatmapFeatureCollection["features"] = [];
  const pointsPerDevice = HEATMAP_POINTS_PER_DEVICE[timeRange] ?? 10;

  for (const device of devices) {
    const location = resolveDeviceLocation(device, mode);
    if (!location) continue;
    const rng = createRng(hashStringToInt(`${device.id}:${timeRange}:heatmap`));

    for (let i = 0; i < pointsPerDevice; i++) {
      const angle = rng() * Math.PI * 2;
      const distanceM = 40 + rng() * 900;
      const eastM = Math.cos(angle) * distanceM;
      const northM = Math.sin(angle) * distanceM;
      const jittered = offsetByMeters(location.lng, location.lat, eastM, northM);
      const statusBoost = device.status === "online" ? 1.0 : device.status === "offline" ? 0.6 : 0.3;
      const weight = clamp((0.35 + rng() * 2.0) * statusBoost, 0, 2.4);

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [jittered.lng, jittered.lat] },
        properties: { weight },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

export function buildTracks(
  devices: Device[],
  selectedDeviceIds: string[],
  mode: LocationMode,
  timeRange: TimeRangePreset,
  intervalSec: number,
): TracksFeatureCollection {
  const selected = new Set(selectedDeviceIds);
  const features: TracksFeatureCollection["features"] = [];

  for (const device of devices) {
    if (!selected.has(device.id)) continue;
    const location = resolveDeviceLocation(device, mode);
    if (!location) continue;

    const rng = createRng(hashStringToInt(`${device.id}:${timeRange}:${intervalSec}:track`));
    const basePoints = TRACK_BASE_POINTS[timeRange] ?? 120;
    const intervalFactor = clamp(30 / Math.max(10, intervalSec), 0.65, 1.35);
    const pointCount = clamp(Math.round(basePoints * intervalFactor), 30, 260);

    const coords: Array<[number, number]> = [];
    let currentLng = location.lng;
    let currentLat = location.lat;
    let heading = rng() * Math.PI * 2;

    coords.push([currentLng, currentLat]);
    for (let i = 1; i < pointCount; i++) {
      heading += (rng() - 0.5) * 0.9;
      const stepM = 30 + rng() * 120;
      const eastM = Math.cos(heading) * stepM;
      const northM = Math.sin(heading) * stepM;
      const next = offsetByMeters(currentLng, currentLat, eastM, northM);
      currentLng = next.lng;
      currentLat = next.lat;
      coords.push([currentLng, currentLat]);
    }

    const smooth = chaikinSmooth(coords, 1);

    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: smooth },
      properties: { deviceId: device.id, color: getDeviceColor(device.id), name: device.deviceName },
    });
  }

  return { type: "FeatureCollection", features };
}

