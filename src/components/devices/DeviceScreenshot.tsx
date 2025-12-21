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
    <div className={cn('w-12 h-12 rounded-lg overflow-hidden border bg-muted shadow-sm', className)}>
      {src ? (
        <img
          src={src}
          alt={`${deviceName} screenshot`}
          className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Monitor className="w-6 h-6 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
