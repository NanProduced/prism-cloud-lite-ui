import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import MapGL, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Flame, 
  Maximize2, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Route, 
  Search, 
  MapPin, 
  Trash2, 
  Crosshair, 
  Loader2,
  AlertCircle,
  MapPinOff
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/store/notificationStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { cn } from "@/lib/utils";
import { type Device, resolveDeviceStatus, type DeviceStatus } from "@/types/device";
import { getDevices } from "@/services/deviceApi";
import { getGpsLatest, setGpsOverride, deleteGpsOverride } from "@/services/telemetryApi";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { useSettingsStore } from "@/store/settingsStore";

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
  { value: "devices", label: "Devices", icon: <MapPin className="h-4 w-4" /> },
  { value: "tracks", label: "Tracks", icon: <Route className="h-4 w-4" /> },
  { value: "heatmap", label: "Heatmap", icon: <Flame className="h-4 w-4" /> },
];

const TIME_RANGE_DEFAULT: TimeRangePreset = "24h";

type StatusFilter = DeviceStatus | "all";

function safeLower(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default function MapPage() {
  const mapRef = useRef<MapRef | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatDateTime } = useTimeFormatter();
  const { preferences } = useSettingsStore();

  const { data: devicesRes } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const { data: gpsLatestRes } = useQuery({
    queryKey: ['telemetry', 'gps', 'latest'],
    queryFn: getGpsLatest,
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [realtimeGps, setRealtimeGps] = useState<Record<string, any>>({});
  const [pulsingDeviceIds, setPulsingDeviceIds] = useState<Set<string>>(new Set());

  // --- SSE Logic ---

  useEffect(() => {
    const handleDeviceUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    };

    const handleGlobalGps = (event: any) => {
      const { scope, data, occurredAt } = event.detail;
      const deviceId = scope.deviceId;
      if (!deviceId) return;

      if (data?.points?.length) {
        const lastPoint = data.points[data.points.length - 1];
        setRealtimeGps(prev => ({
          ...prev,
          [deviceId]: {
            lat: lastPoint.latitude,
            lng: lastPoint.longitude,
            source: 'reported',
            timestamp: occurredAt
          }
        }));

        // Trigger pulse effect
        setPulsingDeviceIds(prev => new Set(prev).add(deviceId));
        setTimeout(() => {
          setPulsingDeviceIds(prev => {
            const next = new Set(prev);
            next.delete(deviceId);
            return next;
          });
        }, 5000); // Pulse for 5 seconds
      }
    };

    window.addEventListener('prism.device.updated', handleDeviceUpdate);
    window.addEventListener('prism.telemetry.gps.reported', handleGlobalGps);
    return () => {
      window.removeEventListener('prism.device.updated', handleDeviceUpdate);
      window.removeEventListener('prism.telemetry.gps.reported', handleGlobalGps);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    // ... rest of the existing SSE logic for selected device if still needed ...
    // Actually, we now have global GPS updates, but the map/stream might provide more frequent updates?
    // Let's keep it for now but the global one is primary for the list.

    const url = `/api/sse/map/stream?deviceId=${selectedDeviceId}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'telemetry.gps.reported' && envelope.data?.points?.length) {
          const lastPoint = envelope.data.points[envelope.data.points.length - 1];
          setRealtimeGps(prev => ({
            ...prev,
            [selectedDeviceId]: {
              lat: lastPoint.latitude,
              lng: lastPoint.longitude,
              source: 'reported',
              timestamp: envelope.occurredAt
            }
          }));
        }
      } catch (e) {
        console.error('[SSE Map] Parse error', e);
      }
    });

    return () => eventSource.close();
  }, [selectedDeviceId]);

  const devices = useMemo(() => {
    const baseDevices = devicesRes?.data || [];
    // Key by string for reliable matching
    const gpsMap = new Map((gpsLatestRes?.data || []).map(p => [String(p.deviceId), p]));

    const transformLocation = (loc: any) => {
      if (!loc) return undefined;
      // If it already has lat/lng, use them. If it has latitude/longitude, map them.
      const lat = loc.lat ?? loc.latitude;
      const lng = loc.lng ?? loc.longitude;
      if (lat === undefined || lng === undefined) return undefined;
      
      return {
        ...loc,
        lat,
        lng,
      };
    };

    return baseDevices.map(d => {
      // Ensure id is always set (API returns deviceId, not id)
      const deviceIdStr = String(d.deviceId || d.id || '');
      const rtGps = realtimeGps[deviceIdStr];
      // Try both string and number ID matching
      const snapshot = gpsMap.get(deviceIdStr) || gpsMap.get(String(d.id));

      const manualLocation = transformLocation(snapshot?.manual || d.manualLocation);
      const reportedLocation = transformLocation(rtGps || snapshot?.reported || d.reportedLocation);

      const updatedDevice = {
        ...d,
        id: deviceIdStr, // Ensure id is always a string
        reportedLocation,
        manualLocation,
      } as Device;

      return {
        ...updatedDevice,
        status: resolveDeviceStatus(updatedDevice),
      };
    });
  }, [devicesRes, gpsLatestRes, realtimeGps]);

  const [view, setView] = useState<MapView>("devices");
  const [showSidebar, setShowSidebar] = useState(true);
  const [basemap, setBasemap] = useState<MapStyleId>("streets");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [locationMode, setLocationMode] = useState<LocationMode>(preferences?.mapLocationMode || "auto");

  useEffect(() => {
    if (preferences?.mapLocationMode) {
      setLocationMode(preferences.mapLocationMode);
    }
  }, [preferences?.mapLocationMode]);

  const [timeRange, setTimeRange] = useState<TimeRangePreset>(TIME_RANGE_DEFAULT);
  const [showMarkers, setShowMarkers] = useState(true);

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
          pulsing: pulsingDeviceIds.has(device.id),
        },
      });
    }
    return { type: "FeatureCollection", features };
  }, [filteredDevices, highlightIds, locationMode, pulsingDeviceIds]);

  const heatmapGeoJson = useMemo(() => {
    return buildHeatmapPoints(filteredDevices, locationMode, timeRange);
  }, [filteredDevices, locationMode, timeRange]);

  const tracksGeoJson = useMemo(() => {
    return buildTracks(devices, selectedTrackIds, locationMode, timeRange, 30);
  }, [devices, selectedTrackIds, locationMode, timeRange]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devices.find((d) => d.id === selectedDeviceId) ?? null;
  }, [devices, selectedDeviceId]);

  const selectedLocation = useMemo(() => {
    if (!selectedDevice) return null;
    return resolveDeviceLocation(selectedDevice, locationMode) ?? null;
  }, [locationMode, selectedDevice]);

  const deviceLayers = useMemo(() => getDeviceLayers(), []);

  const setOverrideMutation = useMutation({
    mutationFn: (args: { deviceId: string; lat: number; lng: number }) =>
      setGpsOverride(args.deviceId, args.lat, args.lng),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry", "gps", "latest"] });
      toast.success("Manual location updated");
    },
    onError: (err: any) => {
      toast.error("Failed to update location: " + (err.message || "Unknown error"));
    }
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (deviceId: string) => deleteGpsOverride(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry", "gps", "latest"] });
      toast.success("Manual location cleared");
    },
  });

  const [pickingLocationFor, setPickingLocationFor] = useState<string | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [manualInput, setManualInput] = useState({ lat: "", lng: "" });

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
    if (pickingLocationFor) {
      setOverrideMutation.mutate({
        deviceId: pickingLocationFor,
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
      setPickingLocationFor(null);
      return;
    }

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
    <div className="flex flex-col gap-4 p-6 h-full overflow-hidden relative">
      {/* Unified Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border shadow-inner">
          {VIEW_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold tracking-tight transition-all",
                view === item.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]"
                  : "text-muted-foreground/60 hover:text-muted-foreground",
              )}
              onClick={() => setView(item.value)}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Dynamic Context Selectors */}
        <div className="flex items-center gap-2">
          {view !== "devices" && (
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRangePreset)}>
              <SelectTrigger className="h-9 w-40 rounded-xl font-semibold text-[11px] tracking-tight border-2">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-[11px] font-medium">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(view === "heatmap" || view === "tracks") && (
            <label className="flex items-center gap-2 rounded-xl border-2 bg-background px-4 h-9 text-[11px] font-semibold tracking-tight cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox checked={showMarkers} onCheckedChange={(v) => setShowMarkers(Boolean(v))} />
              Markers
            </label>
          )}

          <Button variant="outline" size="sm" className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 border-2" onClick={fitToVisible}>
            <Maximize2 className="h-3.5 w-3.5" />
            Fit Map
          </Button>

          {selectedDeviceId && (
             <Button 
               variant="default" 
               size="sm" 
               className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 shadow-sm"
               onClick={() => {
                 const dev = devices.find(d => d.id === selectedDeviceId);
                 const loc = resolveDeviceLocation(dev!, locationMode);
                 setManualInput({ 
                   lat: loc?.lat.toString() || "", 
                   lng: loc?.lng.toString() || "" 
                 });
                 setShowLocationDialog(true);
               }}
             >
               <MapPin className="h-3.5 w-3.5" />
               Set Location
             </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Basemap Switcher */}
          <Select 
            value={basemap} 
            onValueChange={(v) => {
              if (!canUseMapTiler() && v !== 'demo') {
                toast.error("MapTiler API Key required for advanced styles", {
                  description: "Please configure VITE_MAPTILER_KEY in your .env file."
                });
                return;
              }
              setBasemap(v as MapStyleId);
            }}
          >
            <SelectTrigger className="h-9 w-36 rounded-xl font-semibold text-[11px] tracking-tight border-2">
              <SelectValue placeholder="Basemap" />
            </SelectTrigger>
            <SelectContent align="end">
               {MAP_STYLES.map((s) => (
                 <SelectItem key={s.id} value={s.id} className="text-[11px] font-medium">{s.label}</SelectItem>
               ))}
            </SelectContent>
          </Select>

          {!canUseMapTiler() && (
            <Badge variant="outline" className="h-9 rounded-xl border-dashed px-3 text-[10px] font-medium text-muted-foreground hidden lg:flex">
               Demo Map
            </Badge>
          )}

          <Button variant="outline" size="sm" className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 px-4 border-2" onClick={() => setShowSidebar((v) => !v)}>
            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] gap-4 overflow-hidden">
        {showSidebar && (
          <Card className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-none bg-muted/10 shadow-none ring-1 ring-muted/50">
            <div className="p-5 space-y-4 border-b bg-muted/5">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search devices..." className="pl-9 h-10 bg-background border-muted/50 text-sm font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="h-8 rounded-lg font-semibold text-[10px] border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All Statuses</SelectItem>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s} className="text-[10px]">{getStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={locationMode} onValueChange={(v) => setLocationMode(v as any)}>
                  <SelectTrigger className="h-8 rounded-lg font-semibold text-[10px] border">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-[10px]">Auto</SelectItem>
                    <SelectItem value="reported" className="text-[10px]">Reported</SelectItem>
                    <SelectItem value="manual" className="text-[10px]">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {view === "tracks" && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground px-1">
                  <span>Selected: <span className="text-foreground">{selectedTrackIds.length}</span></span>
                  <div className="flex items-center gap-2">
                    <button className="hover:text-primary transition-colors" onClick={() => setSelectedTrackIds(visibleDevicesWithLocation.map((d) => d.id))}>Select All</button>
                    <div className="h-1 w-1 rounded-full bg-muted" />
                    <button className="hover:text-primary transition-colors" onClick={() => setSelectedTrackIds([])}>Clear</button>
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
              {devices.map((device) => {
                const location = resolveDeviceLocation(device, locationMode);
                const selectable = Boolean(location);
                const isTrackChecked = selectedTrackIds.includes(device.id);
                return (
                  <div
                    key={device.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex w-full items-start gap-4 p-3 rounded-2xl transition-all text-left group border-2 border-transparent cursor-pointer",
                      selectedDeviceId === device.id
                        ? "bg-background border-primary shadow-xl shadow-primary/5 -translate-y-0.5"
                        : "hover:bg-background hover:border-muted text-muted-foreground",
                      !selectable && "opacity-60 grayscale",
                    )}
                    onClick={() => {
                      setSelectedDeviceId(device.id);
                      if (selectable && location) {
                        mapRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 12, duration: 650 });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDeviceId(device.id);
                        if (selectable && location) {
                          mapRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 12, duration: 650 });
                        }
                      }
                    }}
                  >
                    {view === "tracks" ? (
                      <div className="pt-1">
                        <Checkbox
                          checked={isTrackChecked}
                          onCheckedChange={(v) => {
                            if (!selectable) return;
                            toggleTrackDevice(device.id, Boolean(v));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    ) : (
                      <div className="pt-2 relative">
                        <div className={cn(
                          "h-2 w-2 rounded-full transition-all duration-300",
                          device.status === 'online' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : 
                          device.status === 'pending' ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" :
                          "bg-slate-400"
                        )} />
                        {device.status === 'online' && pulsingDeviceIds.has(device.id) && (
                          <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-prism-breath" style={{ top: '0.5rem' }} />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm font-bold tracking-tight truncate", selectedDeviceId === device.id ? "text-primary" : "text-foreground/80")}>
                           {device.deviceName}
                        </span>
                        <DeviceStatusBadge
                          status={device.status}
                          pulse={pulsingDeviceIds.has(device.id)}
                          className="h-5 px-2 border-none text-[9px] font-bold uppercase tracking-wider transition-colors duration-300"
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-medium text-muted-foreground/60">
                        <span className="font-mono uppercase tracking-normal">{device.id?.slice(0, 12) ?? "Unknown"}</span>
                        {location ? (
                          <>
                            <div className="h-0.5 w-0.5 rounded-full bg-muted-foreground/30" />
                            <span className="font-mono">{formatLocation(location)}</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <MapPinOff className="h-2.5 w-2.5 text-amber-500/50" />
                            <span className="text-amber-600/80 font-bold uppercase tracking-tighter">Off-Grid</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </ScrollArea>
          </Card>
        )}

        <div className={cn("relative min-w-0 flex-1 overflow-hidden rounded-xl border bg-card", pickingLocationFor && "cursor-crosshair")}>
          <MapGL
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
                <div className="min-w-[240px] p-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-foreground">{selectedDevice?.deviceName}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground font-mono uppercase tracking-tight">{selectedDevice?.id?.slice(0, 16)}</div>
                    </div>
                    {selectedDevice && (
                      <Badge
                        variant="outline"
                        className={cn("h-5 px-2 border-none text-[9px] font-bold uppercase tracking-wider", getStatusBadgeClassName(selectedDevice.status))}
                      >
                        {getStatusLabel(selectedDevice.status)}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 font-medium">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span>{selectedLocation.source === 'manual' ? 'Manual Override' : 'Reported GPS'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-foreground font-mono bg-muted/30 p-1.5 rounded-lg border border-muted/50">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      {formatLocation(selectedLocation)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[10px] px-2 gap-1.5 rounded-lg border-2" 
                        onClick={() => {
                          if (selectedDevice) {
                             const loc = resolveDeviceLocation(selectedDevice, locationMode);
                             setManualInput({ 
                               lat: loc?.lat.toString() || "", 
                               lng: loc?.lng.toString() || "" 
                             });
                             setShowLocationDialog(true);
                          }
                        }}
                        disabled={setOverrideMutation.isPending}
                      >
                        {setOverrideMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                        Set Manual
                      </Button>
                      <Button variant="default" size="sm" className="h-8 text-[10px] px-2 rounded-lg shadow-sm" onClick={() => navigate(`/dashboard/devices/${selectedDevice?.id}`)}>
                        Details
                      </Button>
                    </div>

                    {selectedDevice?.manualLocation && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] px-2 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-lg" 
                        onClick={() => deleteOverrideMutation.mutate(selectedDevice!.id)}
                        disabled={deleteOverrideMutation.isPending}
                      >
                        {deleteOverrideMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Clear Manual
                      </Button>
                    )}
                  </div>

                  {selectedLocation.timestamp && (
                    <div className="text-[9px] text-muted-foreground/60 pt-3 mt-3 border-t text-center italic">
                      Updated {formatDateTime(selectedLocation.timestamp)}
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </MapGL>

          {/* Manual Pick Overlay - Optimized */}
          {pickingLocationFor && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
              <div className="flex items-center gap-4 rounded-full border bg-background/95 backdrop-blur-sm p-2 pl-4 pr-2 shadow-xl pointer-events-auto animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
                    <Crosshair className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">
                    Click map to set location
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-3 hover:bg-muted" onClick={() => setPickingLocationFor(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-[440px] z-[200] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader className="mb-0 space-y-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <MapPin className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl text-white">Set Device Location</DialogTitle>
              </div>
              <DialogDescription className="text-primary-foreground/70">
                Update coordinates manually or pick precisely from the map.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Latitude</label>
                <div className="relative group">
                  <Input 
                    placeholder="e.g. 39.9042" 
                    value={manualInput.lat}
                    onChange={(e) => setManualInput(prev => ({ ...prev, lat: e.target.value }))}
                    className="font-mono text-xs h-11 bg-muted/30 border-2 focus:bg-background transition-all pl-9"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors font-mono text-[10px]">LAT</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Longitude</label>
                <div className="relative group">
                  <Input 
                    placeholder="e.g. 116.4074" 
                    value={manualInput.lng}
                    onChange={(e) => setManualInput(prev => ({ ...prev, lng: e.target.value }))}
                    className="font-mono text-xs h-11 bg-muted/30 border-2 focus:bg-background transition-all pl-9"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors font-mono text-[10px]">LNG</div>
                </div>
              </div>
            </div>

            <div className="relative flex items-center gap-4 py-2">
              <Separator className="flex-1" />
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">OR</span>
              <Separator className="flex-1" />
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-3 h-12 border-2 hover:bg-muted/50 transition-all font-bold text-xs uppercase tracking-wider group"
              onClick={() => {
                setShowLocationDialog(false);
                setPickingLocationFor(selectedDeviceId);
              }}
            >
              <Crosshair className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
              Pick Location on Map
            </Button>
          </div>

          <div className="p-4 bg-muted/30 border-t flex items-center justify-between gap-3 font-semibold">
             <Button variant="ghost" className="font-semibold text-xs" onClick={() => setShowLocationDialog(false)}>Cancel Action</Button>
             <Button 
               className="px-8 font-bold text-xs uppercase tracking-wider h-11 shadow-lg shadow-primary/20"
               onClick={() => {
                 const lat = parseFloat(manualInput.lat);
                 const lng = parseFloat(manualInput.lng);
                 if (isNaN(lat) || isNaN(lng)) {
                   toast.error("Invalid coordinates");
                   return;
                 }
                 if (selectedDeviceId) {
                   setOverrideMutation.mutate({ deviceId: selectedDeviceId, lat, lng });
                   setShowLocationDialog(false);
                 }
               }}
             >
               Apply Changes
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
