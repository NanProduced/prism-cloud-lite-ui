import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { RealtimeMetric } from '../types';
import { getM2TabGroups } from '../constants';
import { SensorGroupCard } from './SensorGroupCard';
import { RelayCard } from './RelayCard';
import { HistoryDrawer } from './HistoryDrawer';
import type { SensorSourceType } from '@/services/telemetryApi';

interface M2SensorTabProps {
  deviceId: number;  // 单设备模式
  metrics: Record<string, RealtimeMetric>;
  historyRange?: { from: string; to: string };
  className?: string;
}

interface HistoryState {
  open: boolean;
  reportType: string;
  sourceType: SensorSourceType;
  metricKeys?: string[];
  title: string;
}

export function M2SensorTab({
  deviceId,
  metrics,
  historyRange,
  className,
}: M2SensorTabProps) {
  const { t } = useTranslation();
  const allGroups = useMemo(() => getM2TabGroups(t), [t]);

  // History drawer state
  const [historyState, setHistoryState] = useState<HistoryState>({
    open: false,
    reportType: '',
    sourceType: 'M2_SENSOR',
    title: '',
  });

  // Handler to open history drawer
  const handleViewHistory = useCallback(
    (reportType: string, metricKeys?: string[]) => {
      // Find the sensor config to get proper title
      let title = reportType;
      let sourceType: SensorSourceType = 'M2_SENSOR';

      for (const group of allGroups) {
        const sensor = group.sensors.find((s) => s.reportType === reportType);
        if (sensor) {
          title = `${group.title} - ${sensor.label}`;
          sourceType = sensor.sourceType;
          break;
        }
      }

      setHistoryState({
        open: true,
        reportType,
        sourceType,
        metricKeys,
        title,
      });
    },
    [allGroups]
  );

  // Close history drawer
  const handleCloseHistory = useCallback(() => {
    setHistoryState((prev) => ({ ...prev, open: false }));
  }, []);

  // Get sensor groups excluding relay (handled by RelayCard)
  const sensorGroups = allGroups.filter((g) => g.id !== 'relay');

  // Check if relay group exists
  const hasRelay = allGroups.some((g) => g.id === 'relay');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sensor Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensorGroups.map((group) => (
          <SensorGroupCard
            key={group.id}
            group={group}
            metrics={metrics}
            deviceId={deviceId}
            onViewHistory={handleViewHistory}
          />
        ))}

        {/* Relay Card - Special display component */}
        {hasRelay && <RelayCard metrics={metrics} />}
      </div>

      {/* History Drawer */}
      <HistoryDrawer
        open={historyState.open}
        onClose={handleCloseHistory}
        deviceId={String(deviceId)}
        reportType={historyState.reportType}
        sourceType={historyState.sourceType}
        metricKeys={historyState.metricKeys}
        title={historyState.title}
        defaultFromIso={historyRange?.from}
        defaultToIso={historyRange?.to}
      />
    </div>
  );
}
