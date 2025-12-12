import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Filter,
  X,
  Circle,
  Wifi,
  RadioTower,
  EthernetPort,
  SignalHigh,
  SignalMedium,
  SignalLow,
} from 'lucide-react';

export interface DeviceFilterState {
  status?: string[];
  networkType?: string[];
  signalStrength?: 'strong' | 'fair' | 'weak';
  brightnessRange?: [number, number];
  storageRange?: [number, number];
  groupBy?: 'status' | 'networkType' | 'signalStrength' | 'none';
}

interface DeviceFiltersProps {
  filters: DeviceFilterState;
  onFilterChange: (filters: DeviceFilterState) => void;
}

export function DeviceFilters({ filters, onFilterChange }: DeviceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'online', label: 'Online', color: 'text-emerald-500' },
    { value: 'offline', label: 'Offline', color: 'text-muted-foreground' },
    { value: 'pending', label: 'Pending', color: 'text-amber-500' },
  ] as const;

  const networkOptions = [
    { value: 'WiFi', label: 'WiFi', Icon: Wifi },
    { value: '4G', label: '4G', Icon: RadioTower },
    { value: 'Ethernet', label: 'Ethernet', Icon: EthernetPort },
  ] as const;

  const signalOptions = [
    { value: 'strong', label: 'Strong', Icon: SignalHigh, color: 'text-emerald-500' },
    { value: 'fair', label: 'Fair', Icon: SignalMedium, color: 'text-amber-500' },
    { value: 'weak', label: 'Weak', Icon: SignalLow, color: 'text-red-500' },
  ] as const;

  const handleStatusToggle = (status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFilterChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const handleNetworkToggle = (network: string) => {
    const current = filters.networkType || [];
    const updated = current.includes(network)
      ? current.filter(n => n !== network)
      : [...current, network];
    onFilterChange({ ...filters, networkType: updated.length > 0 ? updated : undefined });
  };

  const handleSignalStrengthChange = (strength: 'strong' | 'fair' | 'weak' | undefined) => {
    onFilterChange({ ...filters, signalStrength: strength });
  };

  const handleGroupByChange = (groupBy: DeviceFilterState['groupBy']) => {
    onFilterChange({ ...filters, groupBy });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const activeFilterCount = [
    filters.status?.length || 0,
    filters.networkType?.length || 0,
    filters.signalStrength ? 1 : 0,
    filters.groupBy && filters.groupBy !== 'none' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter button and active chips */}
      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            {/* Status */}
            <div className="px-2 py-2 border-b">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Status
              </div>
              <div className="flex gap-1 flex-wrap">
                {statusOptions.map(({ value, label, color }) => (
                  <Badge
                    key={value}
                    variant={filters.status?.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => handleStatusToggle(value)}
                  >
                    <Circle className={`h-2.5 w-2.5 fill-current ${color}`} />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Network type */}
            <div className="px-2 py-2 border-b">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Network Type
              </div>
              <div className="flex gap-1 flex-wrap">
                {networkOptions.map(({ value, label, Icon }) => (
                  <Badge
                    key={value}
                    variant={filters.networkType?.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => handleNetworkToggle(value)}
                  >
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Signal strength */}
            <div className="px-2 py-2 border-b">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Signal Strength
              </div>
              <div className="flex gap-1 flex-wrap">
                {signalOptions.map(({ value, label, Icon, color }) => (
                  <Badge
                    key={value}
                    variant={filters.signalStrength === value ? 'default' : 'outline'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => handleSignalStrengthChange(
                      filters.signalStrength === value ? undefined : value
                    )}
                  >
                    <Icon className={`h-3 w-3 ${color}`} />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Grouping */}
            <div className="px-2 py-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Group By
              </div>
              <div className="flex flex-col gap-1">
                {([
                  { value: 'none', label: 'No Grouping' },
                  { value: 'status', label: 'Status' },
                  { value: 'networkType', label: 'Network Type' },
                  { value: 'signalStrength', label: 'Signal Strength' },
                ] as const).map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={filters.groupBy === value ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => handleGroupByChange(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear button */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active filter chips */}
        {filters.status && filters.status.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {filters.status.map(status => {
              const meta = statusOptions.find(o => o.value === status);
              return (
                <Badge
                  key={status}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {meta && (
                    <Circle className={`h-2.5 w-2.5 fill-current ${meta.color}`} />
                  )}
                  <span className="capitalize">{meta?.label ?? status}</span>
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => handleStatusToggle(status)}
                  />
                </Badge>
              );
            })}
          </div>
        )}

        {filters.networkType && filters.networkType.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {filters.networkType.map(network => (
              <Badge key={network} variant="secondary" className="text-xs">
                {network}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => handleNetworkToggle(network)}
                />
              </Badge>
            ))}
          </div>
        )}

        {filters.signalStrength && (
          <Badge variant="secondary" className="text-xs">
            Signal: {filters.signalStrength}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => handleSignalStrengthChange(undefined)}
            />
          </Badge>
        )}

        {filters.groupBy && filters.groupBy !== 'none' && (
          <Badge variant="secondary" className="text-xs">
            Group: {filters.groupBy}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => handleGroupByChange('none')}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}
