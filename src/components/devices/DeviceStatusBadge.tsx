import { type DeviceStatus } from '@/types/device';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

interface DeviceStatusBadgeProps {
  status?: DeviceStatus | number;
  offlineDuration?: number; // seconds
  className?: string;
}

export function DeviceStatusBadge({
  status,
  offlineDuration,
  className,
}: DeviceStatusBadgeProps) {
  const getStatusConfig = () => {
    if (status === 'online' || status === 1) {
      return {
        label: 'Online',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
      };
    }
    if (status === 'offline' || status === 0) {
      return {
        label: offlineDuration ? `Offline (${formatDuration(offlineDuration)})` : 'Offline',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        borderColor: 'border-gray-200 dark:border-gray-800',
      };
    }
    if (status === 'pending') {
      return {
        label: 'Pending',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-950',
        borderColor: 'border-amber-200 dark:border-amber-800',
      };
    }
    return {
      label: 'Unknown',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      borderColor: 'border-gray-200 dark:border-gray-800',
    };
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Circle className={cn('h-2 w-2 fill-current', config.color)} />
      <span className={config.color}>{config.label}</span>
    </Badge>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  return `${minutes}m ago`;
}
