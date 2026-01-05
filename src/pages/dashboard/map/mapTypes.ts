import type { DeviceLocation, DeviceStatus } from "@/types/device";

export type LocationMode = "auto" | "reported" | "manual";
export type MapView = "devices" | "heatmap" | "tracks";
export type TimeRangePreset = "1h" | "24h" | "7d" | "30d";

export type DeviceFeatureProperties = {
  id: string;
  name: string;
  status: DeviceStatus;
  source: DeviceLocation["source"];
  timestamp: string;
  selected: boolean;
  pulsing: boolean;
};

export type DeviceFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  DeviceFeatureProperties
>;

export type HeatmapFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  { weight: number }
>;

export type TracksFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.LineString,
  { deviceId: string; color: string; name: string }
>;

