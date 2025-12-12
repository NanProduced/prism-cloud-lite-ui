import type { Device } from '@/types/device';
import { DeviceScreenshot } from '@/components/devices/DeviceScreenshot';
import { DeviceStatusBadge } from '@/components/devices/DeviceStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Power,
  RotateCcw,
  Camera,
  AlertTriangle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCardViewProps {
  devices: Device[];
}

export function DeviceCardView({ devices }: DeviceCardViewProps) {
  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No devices found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const lastReport = new Date(device.lastReportTime);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastReport.getTime()) / (1000 * 60);
  const isOutdated = diffMinutes > 60;

  const usedGB = device.storageUsed / (1024 ** 3);
  const totalGB = device.storageTotal / (1024 ** 3);
  const storagePercent = Math.min(100, (device.storageUsed / device.storageTotal) * 100);

  const strength = device.signalStrength ?? 0;
  let signalColor = 'text-red-600';
  if (strength >= 70) signalColor = 'text-green-600';
  else if (strength >= 40) signalColor = 'text-amber-600';

  const SignalIcon =
    strength >= 70 ? SignalHigh :
    strength >= 40 ? SignalMedium :
    strength > 0 ? SignalLow :
    SignalZero;

  let brightnessBarColor = 'bg-blue-500';
  let brightnessLabelColor = 'text-gray-600';
  if (device.brightness < 20) {
    brightnessBarColor = 'bg-amber-500';
    brightnessLabelColor = 'text-amber-600 font-semibold';
  } else if (device.brightness > 80) {
    brightnessBarColor = 'bg-green-500';
    brightnessLabelColor = 'text-green-600';
  }

  const customFieldEntries = device.customFields
    ? Object.entries(device.customFields).slice(0, 2)
    : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <DeviceScreenshot
          src={device.latestScreenshot?.url}
          timestamp={device.latestScreenshot?.timestamp}
          deviceName={device.deviceName}
          className="w-full h-36 rounded-none"
        />
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{device.deviceName}</h3>
            {device.alias && (
              <p className="text-xs text-muted-foreground truncate">{device.alias}</p>
            )}
          </div>
          <DeviceStatusBadge status={device.status} offlineDuration={device.offlineDuration} />
        </div>

        {device.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {device.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {device.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{device.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Last Report</div>
            <div className={cn('text-sm flex items-center gap-1.5', isOutdated && 'text-amber-600 font-semibold')}>
              {isOutdated && <AlertTriangle className="h-3.5 w-3.5" />}
              <span>
                {lastReport.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Network</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{device.networkType}</span>
              {device.signalStrength !== undefined && (
                <span className={cn('text-xs font-semibold flex items-center gap-1', signalColor)}>
                  <SignalIcon className="h-3 w-3" />
                  {device.signalStrength}%
                </span>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Brightness</div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full', brightnessBarColor)}
                  style={{ width: `${device.brightness}%` }}
                />
              </div>
              <span className={cn('text-sm font-medium', brightnessLabelColor)}>
                {device.brightness}%
              </span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Storage</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span>
                  {usedGB.toFixed(1)}/{totalGB.toFixed(0)} GB
                </span>
                <span>{storagePercent.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Resolution</div>
            <div>
              {device.resolution.width}×{device.resolution.height}
            </div>
          </div>

          {device.currentProgram && (
            <div className="space-y-0.5 text-right min-w-0">
              <div className="text-xs text-muted-foreground">Program</div>
              <div className="truncate">{device.currentProgram.name}</div>
              <div className="text-xs text-muted-foreground">
                {device.currentProgram.version}
              </div>
            </div>
          )}
        </div>

        {customFieldEntries.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {customFieldEntries.map(([key, value]) => (
              <div key={key} className="truncate">
                {key}: {String(value)}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Wake or sleep">
          <Power className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Reboot">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Take screenshot">
          <Camera className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
