import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/services/deviceApi';
import { resolveDeviceStatus } from '@/types/device';
import { Monitor, Wifi, WifiOff, Settings2, Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const PinnedDevicesWidget = ({ settings, onUpdateSettings }: { settings?: any, onUpdateSettings?: (s: any) => void }) => {
  const { t } = useTranslation();
  const { data: devicesRes, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const pinnedIds = settings?.deviceIds || [];
  
  const pinnedDevices = useMemo(() => {
    const all = devicesRes?.data || [];
    return all.filter(d => pinnedIds.includes(d.deviceId));
  }, [devicesRes, pinnedIds]);

  const togglePin = (deviceId: number) => {
    const nextIds = pinnedIds.includes(deviceId)
      ? pinnedIds.filter((id: number) => id !== deviceId)
      : [...pinnedIds, deviceId].slice(0, 4); // Limit to 4 for bento look
    onUpdateSettings?.({ ...settings, deviceIds: nextIds });
  };

  if (isLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Monitor className="h-3 w-3" />
          {t('dashboard.widgets.pinnedDevices.liveScreens', { count: pinnedDevices.length })}
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <div className="p-2 border-b">
              <div className="text-xs font-bold">{t('dashboard.widgets.pinnedDevices.selectTitle')}</div>
            </div>
            <ScrollArea className="h-48">
              <div className="p-1">
                {(devicesRes?.data || []).map(device => (
                  <button
                    key={device.deviceId}
                    onClick={() => togglePin(device.deviceId)}
                    className="w-full flex items-center justify-between p-2 hover:bg-accent rounded text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`h-1.5 w-1.5 rounded-full ${resolveDeviceStatus(device) === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="truncate">{device.deviceName}</span>
                    </div>
                    {pinnedIds.includes(device.deviceId) && <Check className="h-3 w-3 text-primary" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
        {pinnedDevices.map(device => {
          const status = resolveDeviceStatus(device);
          return (
            <div key={device.deviceId} className="relative rounded-lg border bg-muted/30 overflow-hidden flex flex-col group">
              <div className="aspect-video w-full bg-black/10 relative overflow-hidden">
                {device.lastScreenshotUrl ? (
                  <img 
                    src={device.lastScreenshotUrl} 
                    alt={device.deviceName}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-1 right-1">
                  {status === 'online' ? (
                    <Wifi className="h-2.5 w-2.5 text-emerald-500 drop-shadow-sm" />
                  ) : (
                    <WifiOff className="h-2.5 w-2.5 text-red-400 drop-shadow-sm" />
                  )}
                </div>
              </div>
              <div className="p-1.5">
                <div className="text-[10px] font-bold truncate leading-tight">{device.deviceName}</div>
                <div className="text-[8px] text-muted-foreground truncate">{device.playingProgram || t('dashboard.widgets.pinnedDevices.idle')}</div>
              </div>
            </div>
          );
        })}
        {pinnedDevices.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-6 opacity-30">
            <Monitor className="h-8 w-8 mb-1" />
            <span className="text-[10px] font-medium text-center">{t('dashboard.widgets.pinnedDevices.noPinned')}</span>
          </div>
        )}
      </div>
    </div>
  );
};