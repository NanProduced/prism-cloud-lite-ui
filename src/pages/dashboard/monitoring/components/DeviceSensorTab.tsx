import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { RealtimeMetric } from '../types';
import { DEVICE_TAB_GROUPS } from '../constants';
import { SensorGroupCard } from './SensorGroupCard';
import { HistoryDrawer } from './HistoryDrawer';
import type { SensorSourceType } from '@/services/telemetryApi';

interface DeviceSensorTabProps {
  deviceId: number;  // 单设备模式
  metrics: Record<string, RealtimeMetric>;
  className?: string;
}

interface HistoryState {
  open: boolean;
  reportType: string;
  sourceType: SensorSourceType;
  metricKeys?: string[];
  title: string;
  isReceiveCard?: boolean;
  netPortNum?: number;
  receiveCardNum?: number;
}

export function DeviceSensorTab({
  deviceId,
  metrics,
  className,
}: DeviceSensorTabProps) {
  // History drawer state
  const [historyState, setHistoryState] = useState<HistoryState>({
    open: false,
    reportType: '',
    sourceType: 'DEVICE_SENSOR',
    title: '',
  });

  // Handler to open history drawer for sensor data
  const handleViewHistory = useCallback(
    (reportType: string, metricKeys?: string[]) => {
      // Find the sensor config to get proper title
      let title = reportType;
      let sourceType: SensorSourceType = 'DEVICE_SENSOR';

      for (const group of DEVICE_TAB_GROUPS) {
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
        isReceiveCard: false,
      });
    },
    []
  );

  // Close history drawer
  const handleCloseHistory = useCallback(() => {
    setHistoryState((prev) => ({ ...prev, open: false }));
  }, []);

  // Device sensor groups (接收卡已移至独立Tab)
  const sensorGroups = DEVICE_TAB_GROUPS;

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
        isReceiveCard={historyState.isReceiveCard}
        netPortNum={historyState.netPortNum}
        receiveCardNum={historyState.receiveCardNum}
      />
    </div>
  );
}