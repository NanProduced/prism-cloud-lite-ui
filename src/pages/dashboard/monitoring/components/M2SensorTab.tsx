import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { RealtimeMetric } from '../types';
import { M2_TAB_GROUPS } from '../constants';
import { SensorGroupCard } from './SensorGroupCard';
import { RelayCard } from './RelayCard';
import { HistoryDrawer } from './HistoryDrawer';
import type { SensorSourceType } from '@/services/telemetryApi';

interface M2SensorTabProps {
  deviceIds: string[];
  metrics: Record<string, RealtimeMetric>;
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
  deviceIds,
  metrics,
  className,
}: M2SensorTabProps) {
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

      for (const group of M2_TAB_GROUPS) {
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
    []
  );

  // Close history drawer
  const handleCloseHistory = useCallback(() => {
    setHistoryState((prev) => ({ ...prev, open: false }));
  }, []);

  // Get sensor groups excluding relay (handled by RelayCard)
  const sensorGroups = M2_TAB_GROUPS.filter((g) => g.id !== 'relay');

  // Check if relay group exists
  const hasRelay = M2_TAB_GROUPS.some((g) => g.id === 'relay');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sensor Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensorGroups.map((group) => (
          <SensorGroupCard
            key={group.id}
            group={group}
            metrics={metrics}
            deviceIds={deviceIds}
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
        deviceId={deviceIds[0] || ''}
        reportType={historyState.reportType}
        sourceType={historyState.sourceType}
        metricKeys={historyState.metricKeys}
        title={historyState.title}
      />
    </div>
  );
}
