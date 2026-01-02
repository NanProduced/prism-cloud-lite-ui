import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/services/deviceApi';
import { resolveDeviceStatus } from '@/types/device';
import { Wifi, WifiOff, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

export const DeviceHealthWidget = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: bffResponse, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const devices = useMemo(() => bffResponse?.data || [], [bffResponse]);
  const onlineCount = useMemo(() => devices.filter(d => resolveDeviceStatus(d) === 'online').length, [devices]);
  const totalCount = devices.length;
  const offlineCount = totalCount - onlineCount;
  const onlinePercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between py-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Wifi className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{onlineCount}</div>
            <div className="text-xs text-muted-foreground">{t('dashboard.widgets.deviceHealth.online')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <WifiOff className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{offlineCount}</div>
            <div className="text-xs text-muted-foreground">{t('dashboard.widgets.deviceHealth.offline')}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('dashboard.widgets.deviceHealth.onlineRate')}</span>
          <span className="font-medium">{onlinePercentage}%</span>
        </div>
        <Progress value={onlinePercentage} className="h-1.5" />
      </div>

      <button 
        onClick={() => navigate('/dashboard/devices')}
        className="mt-4 w-full py-2 text-xs font-medium border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
      >
        <Monitor className="h-3.5 w-3.5" />
        {t('dashboard.widgets.deviceHealth.manageDevices', { count: totalCount })}
      </button>
    </div>
  );
};
