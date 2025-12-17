import { useMemo, useRef, useState, type ReactNode } from "react";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Flame, Maximize2, PanelLeftClose, PanelLeftOpen, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { mockDevices } from "@/lib/mock/devices";
import { cn } from "@/lib/utils";
import type { Device, DeviceStatus } from "@/types/device";

import { getDeviceLayers, HEATMAP_LAYER, TRACKS_LAYER } from "./mapLayers";
import { buildHeatmapPoints, buildTracks } from "./mapMockData";
import { canUseMapTiler, getMapStyleUrl, MAP_STYLES, type MapStyleId } from "./mapStyles";
import type { DeviceFeatureCollection, LocationMode, MapView, TimeRangePreset } from "./mapTypes";
import {
  formatLocation,
  getBoundsFromPoints,
  getDefaultCenter,
  getStatusBadgeClassName,
  getStatusLabel,
  resolveDeviceLocation,
  STATUS_ORDER,
  TIME_RANGE_PRESETS,
} from "./mapUtils";

const VIEW_ITEMS: Array<{ value: MapView; label: string; icon?: ReactNode }> = [
  { value: "devices", label: "Devices" },
  { value: "heatmap", label: "Heatmap", icon: <Flame className="h-4 w-4" /> },
  { value: "tracks", label: "Tracks", icon: <Route className="h-4 w-4" /> },
];

const TIME_RANGE_DEFAULT: TimeRangePreset = "24h";
const INTERVAL_OPTIONS_SEC = [10, 20, 30, 60] as const;

type StatusFilter = DeviceStatus | "all";

function safeLower(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default function MapPage() {
  const mapRef = useRef<MapRef | null>(null);
  const [devices] = useState<Device[]>(() => mockDevices);

  const [view, setView] = useState<MapView>("devices");
  const [showSidebar, setShowSidebar] = useState(true);
  const [basemap, setBasemap] = useState<MapStyleId>("streets");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [locationMode, setLocationMode] = useState<LocationMode>("auto");

  const [timeRange, setTimeRange] = useState<TimeRangePreset>(TIME_RANGE_DEFAULT);
  const [intervalSec, setIntervalSec] = useState<(typeof INTERVAL_OPTIONS_SEC)[number]>(30);
  const [showMarkers, setShowMarkers] = useState(true);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  const filteredDevices = useMemo(() => {
    const q = safeLower(query);
    return devices.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (!q) return true;
      return (
        safeLower(d.deviceName).includes(q) ||
        safeLower(d.alias).includes(q) ||
        safeLower(d.id).includes(q)
      );
    });
  }, [devices, query, status]);

  const visibleDevicesWithLocation = useMemo(() => {
    return filteredDevices.filter((d) => resolveDeviceLocation(d, locationMode));
  }, [filteredDevices, locationMode]);

  const highlightIds = useMemo(() => {
    if (view === "tracks") return new Set(selectedTrackIds);
    return new Set(selectedDeviceId ? [selectedDeviceId] : []);
  }, [selectedDeviceId, selectedTrackIds, view]);

  const deviceGeoJson = useMemo<DeviceFeatureCollection>(() => {
    const features: DeviceFeatureCollection["features"] = [];
    for (const device of filteredDevices) {
      const location = resolveDeviceLocation(device, locationMode);
      if (!location) continue;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [location.lng, location.lat] },
        properties: {
          id: device.id,
          name: device.deviceName,
          status: device.status,
          source: location.source,
          timestamp: location.timestamp,
          selected: highlightIds.has(device.id),
        },
      });
    }
    return { type: "FeatureCollection", features };
  }, [filteredDevices, highlightIds, locationMode]);

  const heatmapGeoJson = useMemo(() => {
    return buildHeatmapPoints(filteredDevices, locationMode, timeRange);
  }, [filteredDevices, locationMode, timeRange]);

  const tracksGeoJson = useMemo(() => {
    return buildTracks(devices, selectedTrackIds, locationMode, timeRange, intervalSec);
  }, [devices, selectedTrackIds, locationMode, timeRange, intervalSec]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devices.find((d) => d.id === selectedDeviceId) ?? null;
  }, [devices, selectedDeviceId]);

  const selectedLocation = useMemo(() => {
    if (!selectedDevice) return null;
    return resolveDeviceLocation(selectedDevice, locationMode) ?? null;
  }, [locationMode, selectedDevice]);

  const deviceLayers = useMemo(() => getDeviceLayers(), []);

  const fitToVisible = () => {
    const points = visibleDevicesWithLocation.map((d) => {
      const loc = resolveDeviceLocation(d, locationMode)!;
      return { lng: loc.lng, lat: loc.lat };
    });
    const bounds = getBoundsFromPoints(points);
    if (!bounds) return;
    mapRef.current?.fitBounds(bounds, { padding: 70, duration: 650 });
  };

  const focusDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;
    const location = resolveDeviceLocation(device, locationMode);
    if (!location) return;
    mapRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 12, duration: 650 });
  };

  const toggleTrackDevice = (deviceId: string, checked: boolean) => {
    setSelectedTrackIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(deviceId);
      else set.delete(deviceId);
      return Array.from(set);
    });
  };

  const onMapClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const layerId = feature.layer.id;
    if (layerId === "device-clusters") {
      const clusterId = (feature.properties as { cluster_id?: number } | null)?.cluster_id;
      if (typeof clusterId !== "number") return;
      const coordinates = feature.geometry.type === "Point" ? (feature.geometry.coordinates as [number, number]) : null;
      if (!coordinates) return;
      const source = mapRef.current?.getSource("devices") as
        | { getClusterExpansionZoom: (id: number, cb: (err: unknown, zoom: number) => void) => void }
        | undefined;
      if (!source) return;
      source.getClusterExpansionZoom(clusterId, (_err, zoom) => {
        mapRef.current?.easeTo({ center: coordinates, zoom, duration: 500 });
      });
      return;
    }

    if (layerId === "device-points") {
      const id = (feature.properties as { id?: string } | null)?.id;
      if (!id) return;
      focusDevice(id);
    }
  };

  const initialViewState = useMemo(() => getDefaultCenter(devices, locationMode), [devices, locationMode]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Map</h1>
          <p className="text-sm text-muted-foreground">
            Search device locations, explore heatmaps, and compare tracks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!canUseMapTiler() && (
            <Badge variant="outline" className="text-muted-foreground">
              Basemap: demo style (set <span className="font-mono">VITE_MAPTILER_KEY</span>)
            </Badge>
          )}

          <select
            aria-label="Basemap style"
            value={basemap}
            onChange={(e) => setBasemap(e.target.value as MapStyleId)}
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {MAP_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSidebar((v) => !v)}>
            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            Sidebar
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {VIEW_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                view === item.value
                  ? "border-primary/50 bg-accent text-accent-foreground"
                  : "hover:bg-accent/20",
              )}
              onClick={() => setView(item.value)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {view !== "devices" && (
            <select
              aria-label="Time range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangePreset)}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {TIME_RANGE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          )}

          {view === "tracks" && (
            <select
              aria-label="Reporting interval"
              value={String(intervalSec)}
              onChange={(e) => setIntervalSec(Number(e.target.value) as (typeof INTERVAL_OPTIONS_SEC)[number])}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {INTERVAL_OPTIONS_SEC.map((s) => (
                <option key={s} value={String(s)}>
                  {s}s interval
                </option>
              ))}
            </select>
          )}

          {(view === "heatmap" || view === "tracks") && (
            <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
              <Checkbox checked={showMarkers} onCheckedChange={(v) => setShowMarkers(Boolean(v))} />
              Markers
            </label>
          )}

          <Button variant="outline" size="sm" className="gap-2" onClick={fitToVisible}>
            <Maximize2 className="h-4 w-4" />
            Fit
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-16rem)] min-h-[640px] gap-4">
        {showSidebar && (
          <Card className="flex h-full w-[360px] shrink-0 flex-col overflow-hidden">
            <div className="flex flex-col gap-3 p-4">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search devices…" />

              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Status filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="all">All statuses</option>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {getStatusLabel(s)}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Location mode"
                  value={locationMode}
                  onChange={(e) => setLocationMode(e.target.value as LocationMode)}
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="auto">Auto</option>
                  <option value="reported">Reported</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {view === "tracks" && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedTrackIds.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTrackIds(visibleDevicesWithLocation.map((d) => d.id))}
                    >
                      Select visible
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTrackIds([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <ScrollArea className="min-h-0 flex-1">
              <div className="p-2">
                {filteredDevices.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No matching devices.</div>
                ) : (
                  <div className="space-y-1">
                    {filteredDevices.map((device) => {
                      const location = resolveDeviceLocation(device, locationMode);
                      const selectable = Boolean(location);
                      const isTrackChecked = selectedTrackIds.includes(device.id);
                      return (
                        <button
                          key={device.id}
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                            selectedDeviceId === device.id ? "bg-accent/60" : "hover:bg-accent/30",
                            !selectable && "opacity-60",
                          )}
                          onClick={() => {
                            if (!selectable) return;
                            focusDevice(device.id);
                          }}
                        >
                          {view === "tracks" ? (
                            <div className="pt-0.5">
                              <Checkbox
                                checked={isTrackChecked}
                                onCheckedChange={(v) => {
                                  if (!selectable) return;
                                  toggleTrackDevice(device.id, Boolean(v));
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            <div className="pt-0.5">
                              <span className="inline-flex h-2 w-2 rounded-full bg-primary/60" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">{device.deviceName}</span>
                              <Badge
                                variant="outline"
                                className={cn("border text-xs", getStatusBadgeClassName(device.status))}
                              >
                                {getStatusLabel(device.status)}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{device.id}</span>
                              {location ? (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">{formatLocation(location)}</span>
                                  <span>·</span>
                                  <span>{location.source}</span>
                                </>
                              ) : (
                                <span className="text-amber-600">No location</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border bg-card">
          <Map
            ref={mapRef}
            initialViewState={initialViewState}
            mapStyle={getMapStyleUrl(basemap)}
            onClick={onMapClick}
            interactiveLayerIds={["device-points", "device-clusters"]}
            style={{ width: "100%", height: "100%" }}
          >
            <NavigationControl position="bottom-right" showCompass />

            {view === "heatmap" && (
              <Source id="heatmap" type="geojson" data={heatmapGeoJson}>
                <Layer {...HEATMAP_LAYER} />
              </Source>
            )}

            {view === "tracks" && (
              <Source id="tracks" type="geojson" data={tracksGeoJson}>
                <Layer {...TRACKS_LAYER} />
              </Source>
            )}

            <Source
              id="devices"
              type="geojson"
              data={deviceGeoJson}
              cluster
              clusterRadius={44}
              clusterMaxZoom={12}
            >
              {(view === "devices" || showMarkers) && (
                <>
                  <Layer {...deviceLayers.clusters} />
                  <Layer {...deviceLayers.clusterCount} />
                  <Layer {...deviceLayers.points} />
                </>
              )}
            </Source>

            {selectedLocation && (
              <Popup
                longitude={selectedLocation.lng}
                latitude={selectedLocation.lat}
                closeButton
                closeOnClick={false}
                onClose={() => setSelectedDeviceId(null)}
                offset={12}
              >
                <div className="min-w-[220px] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{selectedDevice?.deviceName}</div>
                      <div className="mt-1 text-xs text-muted-foreground font-mono">{selectedDevice?.id}</div>
                    </div>
                    {selectedDevice && (
                      <Badge
                        variant="outline"
                        className={cn("border text-xs", getStatusBadgeClassName(selectedDevice.status))}
                      >
                        {getStatusLabel(selectedDevice.status)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedLocation.source} · <span className="font-mono">{formatLocation(selectedLocation)}</span>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>
    </div>
  );
}
