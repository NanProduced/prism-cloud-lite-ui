import { useEffect, useMemo, useState } from 'react';
import { DeviceTable } from './DeviceTable';
import { DeviceCardView } from './DeviceCardView';
import { mockDevices } from '@/lib/mock/devices';
import type { Device } from '@/types/device';
import { DeviceFilters, type DeviceFilterState } from '@/components/devices/DeviceFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Grid3x3, LayoutGrid, Download, Loader2 } from 'lucide-react';

type ViewMode = 'grid' | 'card';

export default function DevicesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = window.localStorage.getItem('devices.viewMode') as ViewMode | null;
    return stored ?? 'card';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DeviceFilterState>({});
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [fullDevices, setFullDevices] = useState<Device[]>([]);
  const [gridDialogSuppressed, setGridDialogSuppressed] = useState(() => {
    return window.localStorage.getItem('devices.gridConfirmDismissed') === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem('devices.viewMode', viewMode);
  }, [viewMode]);

  const filteredDevices = useMemo(() => {
    let filtered = mockDevices;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((device) => (
        device.deviceName.toLowerCase().includes(query) ||
        device.alias?.toLowerCase().includes(query) ||
        device.model.toLowerCase().includes(query) ||
        device.serialNumber?.toLowerCase().includes(query)
      ));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(d => filters.status!.includes(d.status));
    }

    if (filters.networkType && filters.networkType.length > 0) {
      filtered = filtered.filter(d => filters.networkType!.includes(d.networkType));
    }

    if (filters.signalStrength) {
      filtered = filtered.filter(d => {
        const strength = d.signalStrength || 0;
        if (filters.signalStrength === 'strong') return strength >= 70;
        if (filters.signalStrength === 'fair') return strength >= 40 && strength < 70;
        if (filters.signalStrength === 'weak') return strength < 40;
        return true;
      });
    }

    return filtered;
  }, [searchQuery, filters]);

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

    // Lite/mock: full dataset is already available locally.
    // Future: replace with backend full-load request.
    await new Promise((r) => setTimeout(r, 400));
    setFullDevices(mockDevices);
    setGridLoading(false);
    setViewMode('grid');
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {viewMode === 'card' && (
          <div className="relative flex-1 max-w-md min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, alias, model, or serial number..."
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
          {viewMode === 'card' && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-medium">{mockDevices.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Online:</span>
          <span className="font-medium text-emerald-600">
            {mockDevices.filter((d) => d.status === 'online').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Offline:</span>
          <span className="font-medium text-gray-600">
            {mockDevices.filter((d) => d.status === 'offline').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pending:</span>
          <span className="font-medium text-amber-600">
            {mockDevices.filter((d) => d.status === 'pending').length}
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
          <DeviceTable devices={fullDevices.length > 0 ? fullDevices : mockDevices} />
        )
      ) : (
        <DeviceCardView devices={filteredDevices} />
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
