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
  MapPinOff,
  Camera,
  RefreshCw,
  Monitor,
  Info,
  ExternalLink,
  Zap,
  Play,
  X,
  Thermometer,
  Sun,
  Wifi,
  Navigation
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/store/notificationStore";
import { gatewayOrigin, joinUrl } from "@/config/runtime";

import { useTranslation } from "react-i18next";
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
} from "@/components/ui/dialog";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { TagChip } from "@/components/devices/TagChip";
import { ProgramVersionDisplay } from "@/components/programs/ProgramVersionDisplay";
import { cn } from "@/lib/utils";
import { type Device, resolveDeviceStatus, type DeviceStatus } from "@/types/device";
import { getDevices, executeDeviceAction } from "@/services/deviceApi";
import { getGpsLatest, setGpsOverride, deleteGpsOverride } from "@/services/telemetryApi";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { useSettingsStore } from "@/store/settingsStore";
import { reverseGeocode, type ResolvedAddress } from "@/lib/maptiler";

import { getDeviceLayers, HEATMAP_LAYER, TRACKS_LAYER } from "./mapLayers";
import { buildHeatmapPoints, buildTracks } from "./mapMockData";
import { canUseMapTiler, getMapStyleUrl, getMapStyles, type MapStyleId } from "./mapStyles";
import type { DeviceFeatureCollection, LocationMode, MapView, TimeRangePreset } from "./mapTypes";
import {
  formatLocation,
  getBoundsFromPoints,
  getDefaultCenter,
  getStatusBadgeClassName,
  getStatusLabel,
  getTimeRangePresets,
  resolveDeviceLocation,
  STATUS_ORDER,
} from "./mapUtils";

const TIME_RANGE_DEFAULT: TimeRangePreset = "24h";

type StatusFilter = DeviceStatus | "all";

function safeLower(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default function MapPage() {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatDateTime } = useTimeFormatter();
  const { preferences } = useSettingsStore();

  const VIEW_ITEMS: Array<{ value: MapView; label: string; icon?: ReactNode }> = useMemo(() => [
    { value: "devices", label: t('map.views.devices'), icon: <MapPin className="h-4 w-4" /> },
    { value: "tracks", label: t('map.views.tracks'), icon: <Route className="h-4 w-4" /> },
    { value: "heatmap", label: t('map.views.heatmap'), icon: <Flame className="h-4 w-4" /> },
  ], [t]);

  const TIME_RANGE_PRESETS = useMemo(() => getTimeRangePresets(t), [t]);
  const MAP_STYLES = useMemo(() => getMapStyles(t), [t]);

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeScreenshotOpId, setActiveScreenshotOpId] = useState<string | null>(null);
  
  // --- New Map Features ---
  const [sensorMetrics, setSensorMetrics] = useState<Record<string, any>>({});
  const [followEnabled, setFollowEnabled] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  // --- SSE Logic ---

  useEffect(() => {
    const handleDeviceUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    };

    const handleOperationUpdate = (event: any) => {
      const { scope, data } = event.detail;
      if (activeScreenshotOpId && scope.operationId === activeScreenshotOpId) {
        if (data.status === 'CONFIRMED' || data.status === 'COMPLETED') {
          toast.success(t('map.toasts.screenshotCaptured'));
          setActiveScreenshotOpId(null);
          queryClient.invalidateQueries({ queryKey: ['devices'] });
        } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
          toast.error(t('map.toasts.screenshotFailed', { status: data.status }));
          setActiveScreenshotOpId(null);
        }
      }
    };

    const handleGlobalGps = (event: any) => {
      const { scope, data, occurredAt } = event.detail;
      const deviceId = scope.deviceId;
      if (!deviceId) return;

      const deviceIdStr = String(deviceId);

      if (data?.points?.length) {
        const lastPoint = data.points[data.points.length - 1];
        setRealtimeGps(prev => ({
          ...prev,
          [deviceIdStr]: {
            lat: lastPoint.latitude,
            lng: lastPoint.longitude,
            source: 'reported',
            timestamp: occurredAt
          }
        }));

        // Follow Mode Logic
        if (followEnabled && selectedDeviceId === deviceIdStr) {
          mapRef.current?.flyTo({ 
            center: [lastPoint.longitude, lastPoint.latitude], 
            speed: 0.8,
            curve: 1
          });
        }

        // Trigger pulse effect
        setPulsingDeviceIds(prev => new Set(prev).add(deviceIdStr));
        setTimeout(() => {
          setPulsingDeviceIds(prev => {
            const next = new Set(prev);
            next.delete(deviceIdStr);
            return next;
          });
        }, 5000); // Pulse for 5 seconds
      }
    };

    window.addEventListener('prism.device.updated', handleDeviceUpdate);
    window.addEventListener('prism.operation.updated', handleOperationUpdate);
    window.addEventListener('prism.telemetry.gps.reported', handleGlobalGps);
    return () => {
      window.removeEventListener('prism.device.updated', handleDeviceUpdate);
      window.removeEventListener('prism.operation.updated', handleOperationUpdate);
      window.removeEventListener('prism.telemetry.gps.reported', handleGlobalGps);
    };
  }, [queryClient, activeScreenshotOpId, followEnabled, selectedDeviceId]);

  // Sensor Streaming for Selected Device
  useEffect(() => {
    if (!selectedDeviceId) {
      setSensorMetrics({});
      return;
    }

    const url = joinUrl(gatewayOrigin, `/api/sse/monitoring/stream?deviceIds=${selectedDeviceId}`);
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'telemetry.sensor.reported' && envelope.data?.items) {
          const items = envelope.data.items;
          const newMetrics: Record<string, any> = {};
          
          items.forEach((item: any) => {
            if (item.sensorType === 'temperature') newMetrics.temp = item.sensorValue;
            if (item.sensorType === 'bright') newMetrics.bright = item.screenBrightValue || item.sensorValue;
            if (item.sensorType === 'signal') newMetrics.signal = item.sensorValue;
          });

          setSensorMetrics(prev => ({ ...prev, ...newMetrics }));
        }
      } catch (e) {
        console.error('[SSE Map Sensors] Parse error', e);
      }
    });

    return () => eventSource.close();
  }, [selectedDeviceId]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    
    const url = joinUrl(gatewayOrigin, `/api/sse/map/stream?deviceId=${selectedDeviceId}`);
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'telemetry.gps.reported' && envelope.data?.points?.length) {
          const lastPoint = envelope.data.points[envelope.data.points.length - 1];
          const deviceIdStr = String(selectedDeviceId);
          
          setRealtimeGps(prev => ({
            ...prev,
            [deviceIdStr]: {
              lat: lastPoint.latitude,
              lng: lastPoint.longitude,
              source: 'reported',
              timestamp: envelope.occurredAt
            }
          }));

          // Follow Mode for direct stream too
          if (followEnabled) {
            mapRef.current?.flyTo({ 
              center: [lastPoint.longitude, lastPoint.latitude], 
              speed: 0.8
            });
          }
        }
      } catch (e) {
        console.error('[SSE Map GPS] Parse error', e);
      }
    });

    return () => eventSource.close();
  }, [selectedDeviceId, followEnabled]);

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

  // React to theme changes for basemap
  useEffect(() => {
    const theme = preferences.theme;
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setBasemap(isDark ? "dark" : "streets");
  }, [preferences.theme]);

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

  // Reverse Geocoding for Selected Device
  useEffect(() => {
    if (!selectedLocation) {
      setResolvedAddress(null);
      return;
    }

    const resolve = async () => {
      const result = await reverseGeocode(selectedLocation.lng, selectedLocation.lat);
      if (result) {
        setResolvedAddress(result.fullText);
      }
    };

    resolve();
  }, [selectedLocation]);

  const deviceLayers = useMemo(() => getDeviceLayers(), []);

  const setOverrideMutation = useMutation({
    mutationFn: (args: { deviceId: string; lat: number; lng: number }) =>
      setGpsOverride(args.deviceId, args.lat, args.lng),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry", "gps", "latest"] });
      toast.success(t('map.toasts.locationUpdated'));
    },
    onError: (err: any) => {
      toast.error(t('common.errors.updateFailed') + ": " + (err.message || t('common.errors.unknown')));
    }
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (deviceId: string) => deleteGpsOverride(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry", "gps", "latest"] });
      toast.success(t('map.toasts.locationCleared'));
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
                <SelectValue placeholder={t('map.toolbar.timeRange')} />
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
              {t('map.toolbar.markers')}
            </label>
          )}

          <Button variant="outline" size="sm" className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 border-2" onClick={fitToVisible}>
            <Maximize2 className="h-3.5 w-3.5" />
            {t('map.toolbar.fitMap')}
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
               {t('map.toolbar.setLocation')}
             </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Basemap Switcher */}
          <Select 
            value={basemap} 
            onValueChange={(v) => {
              if (!canUseMapTiler() && v !== 'demo') {
                toast.error(t('map.presets.basemapRequired'));
                return;
              }
              setBasemap(v as MapStyleId);
            }}
          >
            <SelectTrigger className="h-9 w-36 rounded-xl font-semibold text-[11px] tracking-tight border-2">
              <SelectValue placeholder={t('map.toolbar.basemap')} />
            </SelectTrigger>
            <SelectContent align="end">
               {MAP_STYLES.map((s) => (
                 <SelectItem key={s.id} value={s.id} className="text-[11px] font-medium">{s.label}</SelectItem>
               ))}
            </SelectContent>
          </Select>

          {!canUseMapTiler() && (
            <Badge variant="outline" className="h-9 rounded-xl border-dashed px-3 text-[10px] font-medium text-muted-foreground hidden lg:flex">
               {t('map.sidebar.demoMap')}
            </Badge>
          )}

          <Button variant="outline" size="sm" className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 px-4 border-2" onClick={() => setShowSidebar((v) => !v)}>
            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            {showSidebar ? t('map.toolbar.hideSidebar') : t('map.toolbar.showSidebar')}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] gap-4 overflow-hidden">
        {showSidebar && (
          <Card className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-none bg-muted/10 shadow-none ring-1 ring-muted/50">
            <div className="p-5 space-y-4 border-b bg-muted/5">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('map.sidebar.searchPlaceholder')} className="pl-9 h-10 bg-background border-muted/50 text-sm font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="h-8 rounded-lg font-semibold text-[10px] border">
                    <SelectValue placeholder={t('map.sidebar.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">{t('map.sidebar.allStatuses')}</SelectItem>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s} className="text-[10px]">{getStatusLabel(s, t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={locationMode} onValueChange={(v) => setLocationMode(v as any)}>
                  <SelectTrigger className="h-8 rounded-lg font-semibold text-[10px] border">
                    <SelectValue placeholder={t('map.sidebar.locationMode')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-[10px]">{t('map.sidebar.modes.auto')}</SelectItem>
                    <SelectItem value="reported" className="text-[10px]">{t('map.sidebar.modes.reported')}</SelectItem>
                    <SelectItem value="manual" className="text-[10px]">{t('map.sidebar.modes.manual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {view === "tracks" && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground px-1">
                  <span>{t('map.sidebar.selectedCount', { count: selectedTrackIds.length })}</span>
                  <div className="flex items-center gap-2">
                    <button className="hover:text-primary transition-colors" onClick={() => setSelectedTrackIds(visibleDevicesWithLocation.map((d) => d.id))}>{t('map.sidebar.selectAll')}</button>
                    <div className="h-1 w-1 rounded-full bg-muted" />
                    <button className="hover:text-primary transition-colors" onClick={() => setSelectedTrackIds([])}>{t('map.sidebar.clear')}</button>
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
                          className="h-5.5 px-2.5 border-none text-[10px] font-black uppercase tracking-wider transition-colors duration-300 shadow-sm"
                        />
                      </div>
                      
                      {/* Tags list instead of ID */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(device.tags || []).length > 0 ? (
                           device.tags?.slice(0, 3).map(tag => (
                             <TagChip 
                               key={tag.id} 
                               tag={tag} 
                               className="h-5 px-1.5 text-[10px]" 
                               textClassName="max-w-[80px]"
                             />
                           ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 italic pl-1">{t('map.sidebar.noTags')}</span>
                        )}
                        {device.tags && device.tags.length > 3 && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground/60">+{device.tags.length - 3}</Badge>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/60">
                        {location ? (
                          <>
                            <MapPin className="h-3 w-3 text-primary/40" />
                            <span className="font-mono tracking-tight">{formatLocation(location)}</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <MapPinOff className="h-3 w-3 text-amber-500/40" />
                            <span className="text-amber-600/70 font-black uppercase tracking-tighter">{t('map.sidebar.offGrid')}</span>
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
                closeButton={false}
                closeOnClick={false}
                onClose={() => setSelectedDeviceId(null)}
                offset={15}
                anchor="bottom"
                className="device-map-popup"
              >
                <Card className="min-w-[280px] overflow-hidden border-none shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                  {/* Screenshot Header */}
                  <div className="relative aspect-video bg-zinc-900 group">
                    {selectedDevice?.lastScreenshotUrl ? (
                      <img 
                        src={selectedDevice.lastScreenshotUrl} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500" 
                        alt="Screenshot" 
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-zinc-500 bg-zinc-900/50">
                        <Monitor className="h-8 w-8 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('map.popup.noPreview')}</span>
                      </div>
                    )}
                    
                    {/* Status Overlays */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                       <div className="flex items-center gap-1.5">
                          <DeviceStatusBadge status={selectedDevice!.status} className="h-6 px-3 bg-black/60 backdrop-blur-md border-none text-[11px] font-black shadow-lg" />
                          <Button 
                             variant="secondary" 
                             size="sm" 
                             className={cn(
                               "h-6 px-2 rounded-lg backdrop-blur-md border-none text-[10px] font-bold shadow-lg transition-all",
                               followEnabled ? "bg-primary text-white" : "bg-black/60 text-white/70 hover:text-white"
                             )}
                             onClick={() => setFollowEnabled(!followEnabled)}
                          >
                             <Navigation className={cn("h-3 w-3 mr-1", followEnabled && "fill-white animate-pulse")} />
                             {followEnabled ? t('map.popup.following') : t('map.popup.follow')}
                          </Button>
                       </div>
                       <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white border-white/20 backdrop-blur-md shadow-lg transition-all"
                          onClick={() => setSelectedDeviceId(null)}
                        >
                          <X className="h-4 w-4" />
                       </Button>
                    </div>

                    {/* Refresh Button */}
                    <div className="absolute bottom-3 right-3">
                       <Button 
                          size="icon" 
                          variant="secondary" 
                          className="h-10 w-10 rounded-full bg-primary text-white shadow-xl hover:scale-110 hover:rotate-12 transition-all active:scale-95 border-2 border-white/20"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!selectedDevice) return;
                            setIsCapturing(true);
                            try {
                              const res = await executeDeviceAction(selectedDevice.id, { type: 'SCREENSHOT', body: {} });
                              if (res.data?.operationId) setActiveScreenshotOpId(res.data.operationId);
                              toast.info(t('map.toasts.captureSent'));
                            } catch (err) {
                              toast.error(t('map.toasts.refreshFailed'));
                            } finally {
                              setIsCapturing(false);
                            }
                          }}
                          disabled={isCapturing || selectedDevice!.status !== 'online'}
                        >
                          {isCapturing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                       </Button>
                    </div>

                    {/* Playing Info Overlay */}
                    {selectedDevice?.playingProgram && (
                      <div className="absolute bottom-3 left-3 right-14">
                        <div className="bg-black/70 backdrop-blur-xl rounded-xl p-2 border border-white/20 flex items-center gap-2.5 max-w-full shadow-2xl">
                           <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-inner">
                              <Play className="h-3.5 w-3.5 text-white fill-white/20" />
                           </div>
                           <ProgramVersionDisplay 
                             name={selectedDevice.playingProgram} 
                             variant="overlay" 
                             className="text-xs font-bold" 
                           />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-foreground truncate tracking-tight">{selectedDevice?.deviceName}</h3>
                        <span className="text-[11px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-lg uppercase tracking-wider">{selectedDevice?.model || "Standard"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDevice?.tags?.slice(0, 3).map(tag => (
                          <TagChip key={tag.id} tag={tag} className="h-5 px-1.5 text-[10px]" />
                        ))}
                      </div>
                    </div>

                    {/* Sensors Row */}
                    <div className="flex items-center gap-2">
                       <SensorBadge icon={Thermometer} value={sensorMetrics.temp} unit="°C" color="text-orange-500" />
                       <SensorBadge icon={Sun} value={sensorMetrics.bright} unit="%" color="text-amber-500" />
                       <SensorBadge icon={Wifi} value={sensorMetrics.signal} unit="dBm" color="text-blue-500" />
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-2xl border border-muted/60 shadow-inner group/address">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                           <p className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest leading-none mb-1.5">
                             {selectedLocation.source === 'manual' ? t('map.sidebar.modes.manual') : t('map.sidebar.modes.gps')}
                           </p>
                           <p className="text-xs font-medium text-muted-foreground leading-tight tracking-tight">
                              {resolvedAddress || formatLocation(selectedLocation)}
                           </p>
                           {resolvedAddress && (
                             <p className="text-[10px] font-mono text-muted-foreground/50 mt-1 tabular-nums group-hover/address:text-muted-foreground/80 transition-colors">
                               {formatLocation(selectedLocation)}
                             </p>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-muted/80">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 text-xs font-bold gap-2 rounded-xl border-2 hover:bg-muted/50 transition-all"
                        onClick={() => {
                          const loc = resolveDeviceLocation(selectedDevice!, locationMode);
                          setManualInput({ 
                            lat: loc?.lat.toString() || "", 
                            lng: loc?.lng.toString() || "" 
                          });
                          setShowLocationDialog(true);
                        }}
                      >
                        <Crosshair className="h-3.5 w-3.5" />
                        {t('map.popup.location')}
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-10 text-xs font-bold gap-2 rounded-xl shadow-lg shadow-primary/20"
                        onClick={() => navigate(`/dashboard/devices/${selectedDevice?.id}`)}
                      >
                        {t('map.popup.details')}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {selectedLocation.timestamp && (
                      <p className="text-[10px] text-muted-foreground/50 text-center font-medium tabular-nums pt-1 flex items-center justify-center gap-1.5">
                        <RefreshCw className="h-2.5 w-2.5" />
                        {t('map.popup.updated', { time: formatDateTime(selectedLocation.timestamp) })}
                      </p>
                    )}
                  </div>
                </Card>
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
                    {t('map.dialogs.location.pickingHint')}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-3 hover:bg-muted" onClick={() => setPickingLocationFor(null)}>{t('common.actions.cancel')}</Button>
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
                <DialogTitle className="text-xl text-white">{t('map.dialogs.location.title')}</DialogTitle>
              </div>
              <DialogDescription className="text-primary-foreground/70">
                {t('map.dialogs.location.description')}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('map.dialogs.location.latitude')}</label>
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('map.dialogs.location.longitude')}</label>
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
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{t('map.dialogs.location.or')}</span>
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
              {t('map.dialogs.location.pickOnMap')}
            </Button>
          </div>

          <div className="p-4 bg-muted/30 border-t flex items-center justify-between gap-3 font-semibold">
             <Button variant="ghost" className="font-semibold text-xs" onClick={() => setShowLocationDialog(false)}>{t('map.dialogs.location.cancel')}</Button>
             <Button 
               className="px-8 font-bold text-xs uppercase tracking-wider h-11 shadow-lg shadow-primary/20"
               onClick={() => {
                 const lat = parseFloat(manualInput.lat);
                 const lng = parseFloat(manualInput.lng);
                 if (isNaN(lat) || isNaN(lng)) {
                   toast.error(t('map.toasts.invalidCoordinates'));
                   return;
                 }
                 if (selectedDeviceId) {
                   setOverrideMutation.mutate({ deviceId: selectedDeviceId, lat, lng });
                   setShowLocationDialog(false);
                 }
               }}
             >
               {t('map.dialogs.location.apply')}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SensorBadge({ icon: Icon, value, unit, color }: { icon: any, value?: string | number, unit: string, color: string }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-muted/50 shadow-sm shrink-0">
       <Icon className={cn("h-3 w-3", color)} />
       <span className="text-[11px] font-black tabular-nums">{value}<span className="text-[9px] ml-0.5 opacity-50 font-bold">{unit}</span></span>
    </div>
  );
}
