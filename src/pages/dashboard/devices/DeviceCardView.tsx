import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { type Device, resolveDeviceStatus, type Tag } from '@/types/device';
import { DeviceScreenshot } from '@/components/devices/DeviceScreenshot';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { TagChip } from '@/components/devices/TagChip';
import { TagPicker } from '@/components/devices/TagPicker';
import { DeviceStatusBadge } from '@/components/devices/DeviceStatusBadge';
import { ProgramVersionDisplay } from '@/components/programs/ProgramVersionDisplay';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        <p className="text-muted-foreground">{t('devices.table.empty')}</p>
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = resolveDeviceStatus(device);
  
  const lastReportLabel = device.lastReportTime ? formatRelative(device.lastReportTime) : t('deviceDetails.header.never');

  const showOutdatedWarn = useMemo(() => {
    if (status !== 'online' || !device.lastReportTime) return false;
    const lastReportValue = new Date(device.lastReportTime);
    return (Date.now() - lastReportValue.getTime() > 1000 * 60 * 10);
  }, [status, device.lastReportTime]);

  const NetworkIcon = useMemo(() => {
    return device.networkType === 'WIFI' || device.networkType === 'WiFi' ? Wifi : 
    (device.networkType === 'FOUR_G' || device.networkType === '4G') ? RadioTower : EthernetPort;
  }, [device.networkType]);

  const displayedTags = useMemo(() => (device.tags || []).slice(0, 2), [device.tags]);
  const remainingTagCount = (device.tags || []).length - displayedTags.length;

  return (
    <Card 
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-md cursor-pointer',
        isSelected ? 'ring-2 ring-primary border-primary/20 bg-primary/5' : 'hover:border-primary/30',
        isPulsing && 'animate-pulse'
      )}
      onClick={onNavigate}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/20">
        <DeviceScreenshot 
          src={device.lastScreenshotUrl}
          deviceName={device.deviceName}
          className="h-full w-full object-cover transition-transform group-hover:scale-105 border-none rounded-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        
        <div className="absolute left-2 top-2 z-10">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            onClick={(e) => e.stopPropagation()}
            className="bg-background/80 backdrop-blur-sm data-[state=checked]:bg-primary"
          />
        </div>

        <div className="absolute right-2 top-2 z-10">
          <DeviceStatusBadge status={status} />
        </div>
      </div>

      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate leading-none mb-1 group-hover:text-primary transition-colors">
              {device.deviceName}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium">
              {device.model || 'Unknown Model'}
            </p>
          </div>
        </div>

        <div 
          className={cn(
            "flex items-center gap-2 text-sm min-w-0 bg-muted/30 p-1.5 rounded-md transition-colors",
            device.currentProgram?.id && "hover:bg-primary/5 hover:text-primary"
          )}
          onClick={(e) => {
            if (device.currentProgram?.id) {
              e.stopPropagation();
              navigate(`/dashboard/programs/${device.currentProgram.id}`);
            }
          }}
        >
          <Play className="h-3.5 w-3.5 text-primary shrink-0" />
          {device.playingProgram ? (
            <ProgramVersionDisplay name={device.playingProgram} variant="compact" />
          ) : (
            <span className="text-[10px] text-muted-foreground">{t('deviceDetails.cockpit.nowPlaying.none')}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <NetworkIcon className="h-3 w-3" />
            <span className="font-bold text-foreground/70 uppercase">{device.networkType || 'OFFLINE'}</span>
          </div>

          <div className={cn('flex items-center gap-1', showOutdatedWarn && 'text-amber-500')}>
            <Clock className="h-3 w-3" />
            <span className={cn(showOutdatedWarn && 'font-bold')}>
              {lastReportLabel}
            </span>
            {showOutdatedWarn && <AlertTriangle className="h-3.5 w-3.5" />}
          </div>

          <div className="flex items-center gap-1">
            <Sun className="h-3.5 w-3.5" />
            <span className="font-bold">{device.brightness}%</span>
          </div>
        </div>

        <div className="pt-1">
          <TagPicker
            allTags={tags}
            selectedTagIds={(device.tags || []).map((t) => t.tagSlug)}
            onToggleTag={(tag) => onToggleDeviceTag(String(device.deviceId), tag)}
            onCreateTag={onCreateTag}
          >
            <button
              type="button"
              className={cn(
                'w-full flex items-center gap-1.5 rounded-md border border-dashed bg-muted/5 px-2 py-1 text-left transition-colors hover:bg-muted/20 hover:border-muted-foreground/30',
                (!device.tags || device.tags.length === 0) && 'text-muted-foreground',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap gap-1 min-w-0 flex-1 py-0.5">
                {displayedTags.length > 0 ? (
                  <>
                    {displayedTags.map((tag) => (
                      <TagChip key={tag.tagSlug} tag={tag} className="h-4 text-[9px] max-w-[80px]" />
                    ))}
                    {remainingTagCount > 0 && (
                      <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black">
                        +{remainingTagCount}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-tight opacity-60">
                    {t('common.actions.create')} {t('devices.table.columns.tags')}
                  </span>
                )}
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </TagPicker>
        </div>
      </CardContent>
    </Card>
  );
}
