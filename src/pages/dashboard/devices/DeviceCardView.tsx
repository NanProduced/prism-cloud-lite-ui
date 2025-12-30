import { useNavigate } from 'react-router-dom';
import { type Device, resolveDeviceStatus } from '@/types/device';
import { DeviceScreenshot } from '@/components/devices/DeviceScreenshot';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Tag } from '@/types/device';
import { TagChip } from '@/components/devices/TagChip';
import { TagPicker } from '@/components/devices/TagPicker';
import { DeviceStatusBadge } from '@/components/devices/DeviceStatusBadge';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import {
  AlertTriangle,
  Clock,
  Wifi,
  RadioTower,
  EthernetPort,
  Sun,
  Play,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCardViewProps {
  devices: Device[];
  tags: Tag[];
  selectedDeviceIds: Set<string>;
  pulsingDeviceIds?: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onToggleDeviceTag: (deviceId: string, tag: Tag) => void;
  onCreateTag: (draft: { name: string; color: string; icon?: string }) => Promise<Tag>;
}

export function DeviceCardView({
  devices,
  tags,
  selectedDeviceIds,
  pulsingDeviceIds,
  onSelectionChange,
  onToggleDeviceTag,
  onCreateTag,
}: DeviceCardViewProps) {
  const navigate = useNavigate();
  const { formatRelative } = useTimeFormatter();

  const handleToggleSelection = (id: string) => {
    const next = new Set(selectedDeviceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No devices found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
      {devices.map((device) => (
        <DeviceCard
          key={device.deviceId}
          device={device}
          tags={tags}
          isSelected={selectedDeviceIds.has(String(device.deviceId))}
          isPulsing={pulsingDeviceIds?.has(String(device.deviceId))}
          onToggleSelection={() => handleToggleSelection(String(device.deviceId))}
          onToggleDeviceTag={onToggleDeviceTag}
          onCreateTag={onCreateTag}
          onNavigate={() => navigate(`/dashboard/devices/${device.deviceId}`)}
          formatRelative={formatRelative}
        />
      ))}
    </div>
  );
}

function DeviceCard({
  device,
  tags,
  isSelected,
  isPulsing,
  onToggleSelection,
  onToggleDeviceTag,
  onCreateTag,
  onNavigate,
  formatRelative,
}: {
  device: Device;
  tags: Tag[];
  isSelected: boolean;
  isPulsing?: boolean;
  onToggleSelection: () => void;
  onToggleDeviceTag: (deviceId: string, tag: Tag) => void;
  onCreateTag: (draft: { name: string; color: string; icon?: string }) => Promise<Tag>;
  onNavigate: () => void;
  formatRelative: (d: string) => string;
}) {
  const lastReportValue = device.lastReportTime ? new Date(device.lastReportTime) : null;
  const now = new Date();
  const diffMinutes = lastReportValue ? (now.getTime() - lastReportValue.getTime()) / (1000 * 60) : 0;
  const isOutdated = lastReportValue ? diffMinutes > 60 : false;

  const NetworkIcon =
    device.networkType === 'WIFI' || device.networkType === 'WiFi' ? Wifi : 
    (device.networkType === 'FOUR_G' || device.networkType === '4G') ? RadioTower : EthernetPort;

  const lastReportLabel = formatRelative(device.lastReportTime);
  const showOutdatedWarn = device.onlineStatus === 1 && isOutdated;

  const displayedTags = (device.tags || []).slice(0, 2);
  const remainingTagCount = Math.max(0, (device.tags?.length || 0) - displayedTags.length);

  return (
    <Card className={cn('group overflow-hidden transition-all', isSelected && 'ring-2 ring-primary')}>
      <div className="relative">
        <div className="cursor-pointer" onClick={onNavigate}>
          <DeviceScreenshot
            src={device.lastScreenshotUrl}
            timestamp={device.lastReportTime}
            deviceName={device.deviceName}
            className="h-24 w-full rounded-none transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute top-2 left-2">
          <DeviceStatusBadge
            status={resolveDeviceStatus(device)}
            powerStatus={device.powerStatus}
            pulse={isPulsing}
            className="shadow-lg backdrop-blur-sm"
          />
        </div>
        <div className="absolute top-2 right-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="h-5 w-5 rounded-md border-white/50 bg-black/20 shadow-lg backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 
              className="font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors"
              onClick={onNavigate}
            >
              {device.deviceName}
            </h3>
            <Badge variant="secondary" className="text-xs font-medium">
              {device.model}
            </Badge>
          </div>
          {device.description && (
            <p className="text-xs text-muted-foreground truncate">{device.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Play className="h-4 w-4 text-muted-foreground shrink-0" />
          {device.playingProgram ? (
            <div className="min-w-0 flex items-center gap-2">
              <span className="truncate">{device.playingProgram}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No program</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <NetworkIcon className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground/80">{device.networkType}</span>
            {device.networkStrength !== undefined && (
              <span className="text-muted-foreground">{device.networkStrength}%</span>
            )}
          </div>

          <div className={cn('flex items-center gap-1', showOutdatedWarn && 'text-amber-600')}>
            <Clock className="h-3.5 w-3.5" />
            <span className={cn(showOutdatedWarn && 'font-semibold')}>
              {lastReportLabel}
            </span>
            {showOutdatedWarn && <AlertTriangle className="h-3.5 w-3.5" />}
          </div>

          <div className="flex items-center gap-1">
            <Sun className="h-3.5 w-3.5" />
            <span>{device.brightness}%</span>
          </div>
        </div>

        <TagPicker
          allTags={tags}
          selectedTagIds={(device.tags || []).map((t) => t.tagSlug)}
          onToggleTag={(tag) => onToggleDeviceTag(String(device.deviceId), tag)}
          onCreateTag={onCreateTag}
        >
          <button
            type="button"
            className={cn(
              'w-full flex items-center gap-1.5 rounded-md border bg-muted/10 px-2 py-1.5 text-left transition-colors hover:bg-muted/20',
              (!device.tags || device.tags.length === 0) && 'text-muted-foreground',
            )}
            aria-label="Edit tags"
          >
            <div className="flex flex-wrap gap-1 min-w-0 flex-1">
              {displayedTags.length > 0 ? (
                <>
                  {displayedTags.map((tag) => (
                    <TagChip key={tag.tagSlug} tag={tag} className="max-w-[120px]" />
                  ))}
                  {remainingTagCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{remainingTagCount}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-xs">Add tags</span>
              )}
            </div>
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </TagPicker>
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
