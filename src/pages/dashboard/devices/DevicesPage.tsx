import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeviceTable } from './DeviceTable';
import { DeviceCardView } from './DeviceCardView';
import { 
  getDevices, 
  getCustomFieldDefs, 
  createCustomFieldDef, 
  deleteCustomFieldDef, 
  updateDeviceCustomFieldValues 
} from '@/services/deviceApi';
import { type Device, type Tag, resolveDeviceStatus } from '@/types/device';
import type { DeviceCustomFieldDef, DeviceCustomFieldValue } from '@/types/device-custom-field';
import { DeviceFilters, type DeviceFilterState } from '@/components/devices/DeviceFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Grid3x3, LayoutGrid, Download, Loader2, Zap, Plus } from 'lucide-react';
import { BatchCommandDialog } from '@/features/devices/commands/BatchCommandDialog';
import { AddDeviceDialog } from '@/components/devices/AddDeviceDialog';
import { toast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

type ViewMode = 'grid' | 'card';

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const { data: bffResponse, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const { data: cfResponse, isLoading: isCfLoading } = useQuery({
    queryKey: ['device-custom-fields'],
    queryFn: () => getCustomFieldDefs(),
  });

  const devices = useMemo(() => bffResponse?.data || [], [bffResponse]);
  const customFieldDefs = useMemo(() => cfResponse?.data || [], [cfResponse]);

  // Determine if Pro features are active based on actual subscription
  const isProActive = useMemo(() => {
    return user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'ULTRA';
  }, [user]);

  // Mutations
  const updateFieldValueMutation = useMutation({
    mutationFn: ({ deviceId, fieldId, value }: { deviceId: string; fieldId: number; value: DeviceCustomFieldValue }) => 
      updateDeviceCustomFieldValues(deviceId, { [String(fieldId)]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error: any) => {
      toast('Update failed', { description: error.message || 'Failed to update custom field' });
    }
  });

  const createFieldMutation = useMutation({
    mutationFn: (def: Partial<DeviceCustomFieldDef>) => createCustomFieldDef(def),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-custom-fields'] });
      toast('Success', { description: 'Custom field created' });
    }
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: number) => deleteCustomFieldDef(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-custom-fields'] });
      toast('Success', { description: 'Custom field deleted' });
    }
  });

  const updateFieldMutation = useMutation({
    mutationFn: (def: DeviceCustomFieldDef) => updateCustomFieldDef(def.fieldId, def),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-custom-fields'] });
    }
  });

  const handleCustomFieldDefsChange = async (nextDefs: DeviceCustomFieldDef[]) => {
    // Basic implementation: find changed fields and update them
    // In a real app, a bulk update API would be better
    const changed = nextDefs.filter(next => {
      const prev = customFieldDefs.find(p => p.fieldId === next.fieldId);
      return JSON.stringify(prev) !== JSON.stringify(next);
    });

    for (const field of changed) {
      await updateFieldMutation.mutateAsync(field);
    }
  };

  // Real-time updates via SSE
  useEffect(() => {
    const handleDeviceUpdate = () => {
      // Invalidate query to refetch data
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    };

    const handleGlobalGps = (event: any) => {
      const { scope } = event.detail;
      const deviceId = scope.deviceId;
      if (!deviceId) return;

      setPulsingDeviceIds(prev => new Set(prev).add(deviceId));
      setTimeout(() => {
        setPulsingDeviceIds(prev => {
          const next = new Set(prev);
          next.delete(deviceId);
          return next;
        });
      }, 5000);
    };

    window.addEventListener('prism.device.updated', handleDeviceUpdate);
    window.addEventListener('prism.device.status.changed', handleDeviceUpdate);
    window.addEventListener('prism.telemetry.gps.reported', handleGlobalGps);
    
    return () => {
      window.removeEventListener('prism.device.updated', handleDeviceUpdate);
      window.removeEventListener('prism.device.status.changed', handleDeviceUpdate);
      window.removeEventListener('prism.telemetry.gps.reported', handleGlobalGps);
    };
  }, [queryClient]);

  const [tags, setTags] = useState<Tag[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = window.localStorage.getItem('devices.viewMode') as ViewMode | null;
    return stored ?? 'card';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DeviceFilterState>({});
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [pulsingDeviceIds, setPulsingDeviceIds] = useState<Set<string>>(new Set());
  const [showBatchCommandDialog, setShowBatchCommandDialog] = useState(false);
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [fullDevices, setFullDevices] = useState<Device[]>([]);
  const [gridDialogSuppressed, setGridDialogSuppressed] = useState(() => {
    return window.localStorage.getItem('devices.gridConfirmDismissed') === 'true';
  });

  // Extract all unique tags from devices
  useEffect(() => {
    if (devices.length > 0) {
      const allTags = new Map<string, Tag>();
      devices.forEach(d => {
        d.tags?.forEach(t => {
          allTags.set(t.tagSlug, t);
        });
      });
      setTags(Array.from(allTags.values()));
    }
  }, [devices]);

  useEffect(() => {
    window.localStorage.setItem('devices.viewMode', viewMode);
  }, [viewMode]);

  const createTag = (draft: { name: string; color: string; icon?: string }): Tag => {
    const newTag: Tag = {
      tagName: draft.name.trim(),
      tagSlug: slugify(draft.name.trim()),
      color: draft.color,
      icon: draft.icon,
    };
    setTags((prev) => [newTag, ...prev]);
    return newTag;
  };

  const toggleDeviceTag = (deviceId: string, tag: Tag) => {
    // This now only affects local state or would need an API call
    console.log('Toggle tag', deviceId, tag);
  };

  const updateDeviceCustomFieldValue = (deviceId: string, fieldId: number, value: DeviceCustomFieldValue) => {
    updateFieldValueMutation.mutate({ deviceId, fieldId, value });
  };

  const addCustomFieldDef = (def: DeviceCustomFieldDef) => {
    createFieldMutation.mutate(def);
  };

  const deleteCustomFieldDef = (fieldId: number) => {
    deleteFieldMutation.mutate(fieldId);
  };

  const filteredDevices = useMemo(() => {
    let filtered = devices;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((device) => (
        device.deviceName.toLowerCase().includes(query) ||
        device.description?.toLowerCase().includes(query) ||
        device.model.toLowerCase().includes(query) ||
        device.tags.some((t) => t.tagName.toLowerCase().includes(query))
      ));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(d => {
        const statusStr = resolveDeviceStatus(d);
        return filters.status!.includes(statusStr as any);
      });
    }

    if (filters.networkType && filters.networkType.length > 0) {
      filtered = filtered.filter(d => filters.networkType!.includes(d.networkType as any));
    }

    if (filters.signalStrength) {
      filtered = filtered.filter(d => {
        const strength = d.networkStrength || 0;
        if (filters.signalStrength === 'strong') return strength >= 70;
        if (filters.signalStrength === 'fair') return strength >= 40 && strength < 70;
        if (filters.signalStrength === 'weak') return strength < 40;
        return true;
      });
    }

    return filtered;
  }, [devices, searchQuery, filters]);

  const hasAdvancedFilters = Boolean(
    (filters.status && filters.status.length > 0) ||
    (filters.networkType && filters.networkType.length > 0) ||
    filters.signalStrength ||
    (filters.groupBy && filters.groupBy !== 'none')
  );

  const handleSwitchToGrid = () => {
    if (viewMode === 'grid') return;
    if (gridDialogSuppressed || fullDevices.length > 0) {
      setViewMode('grid');
      return;
    }
    setShowGridDialog(true);
  };

  const confirmSwitchToGrid = async () => {
    if (dontShowAgain) {
      window.localStorage.setItem('devices.gridConfirmDismissed', 'true');
      setGridDialogSuppressed(true);
    }
    setShowGridDialog(false);
    setGridLoading(true);

    await new Promise((r) => setTimeout(r, 400));
    setFullDevices(devices);
    setGridLoading(false);
    setViewMode('grid');
  };

  if (isDevicesLoading || isCfLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button 
          size="sm" 
          className="gap-2 shrink-0"
          onClick={() => setShowAddDeviceDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Add Device
        </Button>

        {viewMode === 'card' && (
          <div className="relative flex-1 max-w-md min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          {viewMode === 'card' && (
            <DeviceFilters filters={filters} onFilterChange={setFilters} />
          )}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={handleSwitchToGrid}
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowBatchCommandDialog(true)}
                  >
                    <Zap className="h-4 w-4" />
                    Command {selectedDeviceIds.size > 0 && `(${selectedDeviceIds.size})`}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedDeviceIds.size === 0 ? "Open command wizard" : `Command ${selectedDeviceIds.size} selected device(s)`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {viewMode === 'card' && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      <BatchCommandDialog
        open={showBatchCommandDialog}
        onOpenChange={setShowBatchCommandDialog}
        devices={devices}
        initialSelectedDeviceIds={Array.from(selectedDeviceIds)}
        mode="multi-device"
      />

      <AddDeviceDialog
        open={showAddDeviceDialog}
        onOpenChange={setShowAddDeviceDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['devices'] })}
      />

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-medium">{devices.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Online:</span>
          <span className="font-medium text-emerald-600">
            {devices.filter((d) => resolveDeviceStatus(d) === 'online').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Offline:</span>
          <span className="font-medium text-gray-600">
            {devices.filter((d) => resolveDeviceStatus(d) === 'offline').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pending:</span>
          <span className="font-medium text-amber-600">
            {devices.filter((d) => resolveDeviceStatus(d) === 'pending').length}
          </span>
        </div>
        {viewMode === 'card' && (searchQuery || hasAdvancedFilters) && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Filtered:</span>
            <span className="font-medium">{filteredDevices.length}</span>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        gridLoading ? (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading all devices for analysis…
            </div>
          </div>
        ) : (
          <DeviceTable
            devices={fullDevices.length > 0 ? fullDevices : devices}
            customFieldDefs={customFieldDefs}
            isProActive={isProActive}
            selectedDeviceIds={selectedDeviceIds}
            pulsingDeviceIds={pulsingDeviceIds}
            onSelectionChange={setSelectedDeviceIds}
            onBatchCommand={() => setShowBatchCommandDialog(true)}
            onCustomFieldDefsChange={handleCustomFieldDefsChange}
            onCustomFieldCreate={addCustomFieldDef}
            onCustomFieldDelete={deleteCustomFieldDef}
            onCustomFieldValueChange={updateDeviceCustomFieldValue}
          />
        )
      ) : (
        <DeviceCardView
          devices={filteredDevices}
          tags={tags}
          selectedDeviceIds={selectedDeviceIds}
          pulsingDeviceIds={pulsingDeviceIds}
          onSelectionChange={setSelectedDeviceIds}
          onCreateTag={createTag}
          onToggleDeviceTag={toggleDeviceTag}
        />
      )}

      <Dialog open={showGridDialog} onOpenChange={setShowGridDialog}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Switch to Grid (Analyze)</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Grid view loads all devices for advanced analysis, grouping, and aggregations.
              This may take a few seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 text-sm mt-4">
            <input
              id="dont-show-again"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <label htmlFor="dont-show-again" className="cursor-pointer">
              Don’t show this again
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setShowGridDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSwitchToGrid}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
