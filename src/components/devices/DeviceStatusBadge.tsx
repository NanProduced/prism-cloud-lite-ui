import { type DeviceStatus } from '@/types/device';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Circle, Moon, Power } from 'lucide-react';

interface DeviceStatusBadgeProps {
  status?: DeviceStatus | number;
  powerStatus?: number | null;
  offlineDuration?: number; // seconds
  className?: string;
  pulse?: boolean;
}

export function DeviceStatusBadge({
  status,
  powerStatus,
  offlineDuration,
  className,
  pulse,
}: DeviceStatusBadgeProps) {
  const isOnline = status === 'online' || status === 1;
  const getStatusConfig = () => {
    if (isOnline) {
      return {
        label: 'Online',
        color: 'text-emerald-600 dark:text-emerald-400',
        dotColor: 'bg-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      };
    }
    if (status === 'offline' || status === 0) {
      return {
        label: offlineDuration ? `Offline (${formatDuration(offlineDuration)})` : 'Offline',
        color: 'text-slate-600 dark:text-slate-400',
        dotColor: 'bg-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
      };
    }
    if (status === 'pending') {
      return {
        label: 'Pending',
        color: 'text-amber-600 dark:text-amber-400',
        dotColor: 'bg-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
      };
    }
    return {
      label: 'Unknown',
      color: 'text-gray-500',
      dotColor: 'bg-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-2 px-2.5 py-0.5 text-[10px] font-bold tracking-wider transition-all duration-300',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <div className="relative flex items-center justify-center">
          <div className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
          {pulse && isOnline && (
            <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-prism-breath scale-[2.5]" />
          )}
        </div>
        <span className={config.color}>{config.label}</span>
      </Badge>

      {isOnline && powerStatus === 0 && (
        <Badge
          variant="outline"
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 bg-blue-500/5 text-blue-600 border-blue-500/20'
          )}
        >
          <Moon className="h-3 w-3" />
          <span>Sleep</span>
        </Badge>
      )}
    </div>
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
