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
  deviceName,
  className,
}: DeviceScreenshotProps) {
  return (
    <div className={cn('w-12 h-12 rounded overflow-hidden', className)}>
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
  );
}
