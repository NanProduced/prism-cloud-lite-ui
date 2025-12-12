import { Monitor } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@lytenyte/components/ui/hover-card';
import { cn } from '@/lib/utils';

interface DeviceScreenshotProps {
  src?: string;
  timestamp?: string;
  deviceName: string;
  className?: string;
}

export function DeviceScreenshot({
  src,
  timestamp,
  deviceName,
  className,
}: DeviceScreenshotProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className={cn('w-12 h-12 rounded overflow-hidden cursor-pointer', className)}>
          {src ? (
            <img
              src={src}
              alt={`${deviceName} screenshot`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Monitor className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </HoverCardTrigger>
      {src && (
        <HoverCardContent side="right" className="w-80" sideOffset={10}>
          <div className="space-y-2">
            <img
              src={src}
              alt={`${deviceName} screenshot preview`}
              className="w-full rounded border"
            />
            {timestamp && (
              <p className="text-xs text-muted-foreground">
                Captured: {new Date(timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
}
