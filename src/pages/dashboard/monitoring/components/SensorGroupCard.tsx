import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { RealtimeMetric } from '../types';
import type { SensorGroup, SensorMapping } from '../constants';
import { CHART_COLORS, ALERT_THRESHOLDS } from '../constants';

interface SensorGroupCardProps {
  group: SensorGroup;
  metrics: Record<string, RealtimeMetric>;
  deviceId: number;  // 单设备模式
  onViewHistory?: (reportType: string, metricKeys?: string[]) => void;
  className?: string;
}

export function SensorGroupCard({
  group,
  metrics,
  deviceId,
  onViewHistory,
  className,
}: SensorGroupCardProps) {
  const { t } = useTranslation();
  const [activeMetric, setActiveMetric] = useState<string>(
    group.sensors[0]?.reportType || ''
  );

  // Get metrics for this group
  const groupMetrics = useMemo(() => {
    const result: Record<string, RealtimeMetric[]> = {};

    group.sensors.forEach((sensor) => {
      const key = sensor.reportType;
      result[key] = [];

      // Find metrics matching this sensor
      Object.values(metrics).forEach((metric) => {
        if (
          metric.reportType === sensor.reportType &&
          metric.sourceType === sensor.sourceType
        ) {
          result[key].push(metric);
        }
      });
    });

    return result;
  }, [group.sensors, metrics]);

  // Check if we have any data
  const hasData = Object.values(groupMetrics).some((arr) => arr.length > 0);

  // Get active sensor config
  const activeSensor = group.sensors.find((s) => s.reportType === activeMetric);

  // Get latest value for display
  const getLatestValue = (reportType: string): { value: any; at: string } | null => {
    const sensorMetrics = groupMetrics[reportType];
    if (!sensorMetrics || sensorMetrics.length === 0) return null;

    // Get the most recent metric
    const sorted = [...sensorMetrics].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
    return { value: sorted[0].value, at: sorted[0].at };
  };

  // Prepare chart data from history
  const chartData = useMemo(() => {
    if (!activeMetric) return [];

    const sensorMetrics = groupMetrics[activeMetric];
    if (!sensorMetrics || sensorMetrics.length === 0) return [];

    // Merge history from all devices
    const allPoints: { at: string; val: number; deviceId: string }[] = [];
    sensorMetrics.forEach((metric) => {
      metric.history.forEach((point) => {
        allPoints.push({
          at: point.at,
          val: point.val,
          deviceId: metric.deviceId,
        });
      });
    });

    // Sort by time
    allPoints.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    // 单设备模式：直接返回值
    return allPoints.map((p) => ({
      at: p.at,
      value: p.val,
    }));
  }, [activeMetric, groupMetrics]);

  // Check if value exceeds threshold
  const getAlertStatus = (
    reportType: string,
    value: number
  ): 'normal' | 'warning' | 'critical' => {
    const thresholds = ALERT_THRESHOLDS[reportType as keyof typeof ALERT_THRESHOLDS];
    if (!thresholds) return 'normal';
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  };

  const Icon = group.icon;

  // Determine if we should use tabs or simple display
  const useTabs =
    group.sensors.length > 1 &&
    (group.id === 'climate' || group.id === 'airQuality');

  // Group sensors by category for tabs
  const sensorTabs = useMemo(() => {
    if (group.id === 'climate') {
      return [
        {
          key: 'temperature',
          label: t('monitoring.receiveCard.temp'),
          sensors: group.sensors.filter((s) =>
            s.reportType.toLowerCase().includes('temperature')
          ),
        },
        {
          key: 'humidity',
          label: t('monitoring.receiveCard.humidity'),
          sensors: group.sensors.filter((s) =>
            s.reportType.toLowerCase().includes('humidity')
          ),
        },
      ];
    }
    if (group.id === 'airQuality') {
      return [
        {
          key: 'pm',
          label: 'PM',
          sensors: group.sensors.filter((s) =>
            s.reportType.startsWith('pm')
          ),
        },
        {
          key: 'smoke',
          label: t('monitoring.sensors.labels.smoke'),
          sensors: group.sensors.filter((s) => s.reportType === 'smoke'),
        },
        {
          key: 'noise',
          label: t('monitoring.sensors.labels.noise'),
          sensors: group.sensors.filter((s) => s.reportType === 'noise'),
        },
      ];
    }
    return [];
  }, [group, t]);

  return (
    <Card
      className={cn(
        'rounded-lg border bg-card shadow-sm overflow-hidden',
        className
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground/70">
            {group.title}
          </CardTitle>
        </div>
        {onViewHistory && activeSensor && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] font-bold gap-1 px-2"
            onClick={() =>
              onViewHistory(activeSensor.reportType, activeSensor.metricKeys)
            }
          >
            {t('monitoring.sensors.history')}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
            <Icon className="h-8 w-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              {t('monitoring.status.awaitingData')}
            </p>
          </div>
        ) : useTabs ? (
          <Tabs
            defaultValue={sensorTabs[0]?.key}
            onValueChange={(val) => {
              const tab = sensorTabs.find((t) => t.key === val);
              if (tab?.sensors[0]) {
                setActiveMetric(tab.sensors[0].reportType);
              }
            }}
          >
            <TabsList className="bg-muted/50 p-0.5 h-7 mb-3 rounded-md">
              {sensorTabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="text-[9px] font-bold h-6 px-3 rounded-sm data-[state=active]:bg-background"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {sensorTabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="mt-0">
                <SensorDisplay
                  sensors={tab.sensors}
                  groupMetrics={groupMetrics}
                  chartData={chartData}
                  chartType={group.chartType}
                  getLatestValue={getLatestValue}
                  getAlertStatus={getAlertStatus}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <SensorDisplay
            sensors={group.sensors}
            groupMetrics={groupMetrics}
            chartData={chartData}
            chartType={group.chartType}
            getLatestValue={getLatestValue}
            getAlertStatus={getAlertStatus}
          />
        )}
      </CardContent>
    </Card>
  );
}

// --- Internal Component: Sensor Display ---

interface SensorDisplayProps {
  sensors: SensorMapping[];
  groupMetrics: Record<string, RealtimeMetric[]>;
  chartData: any[];
  chartType: 'area' | 'line' | 'status' | 'drilldown';
  getLatestValue: (reportType: string) => { value: any; at: string } | null;
  getAlertStatus: (
    reportType: string,
    value: number
  ) => 'normal' | 'warning' | 'critical';
}

function SensorDisplay({
  sensors,
  groupMetrics,
  chartData,
  chartType,
  getLatestValue,
  getAlertStatus,
}: SensorDisplayProps) {
  const { t } = useTranslation();
  const { formatDateTime } = useTimeFormatter();
  // Get primary sensor for display
  const primarySensor = sensors[0];
  const latest = primarySensor ? getLatestValue(primarySensor.reportType) : null;

  const alertStatus =
    latest && typeof latest.value === 'number'
      ? getAlertStatus(primarySensor.reportType, latest.value)
      : 'normal';

  const alertColors = {
    normal: 'text-foreground',
    warning: 'text-amber-500',
    critical: 'text-rose-500',
  };

  return (
    <div className="space-y-3">
      {/* Current Value */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-2xl font-bold tracking-tighter tabular-nums',
              alertColors[alertStatus]
            )}
          >
            {latest
              ? typeof latest.value === 'number'
                ? latest.value.toFixed(1)
                : latest.value
              : '—'}
          </span>
          {primarySensor?.unit && (
            <span className="text-xs font-medium text-muted-foreground">
              {primarySensor.unit}
            </span>
          )}
        </div>
        {latest && (
          <span className="text-[9px] font-mono text-muted-foreground">
            {formatDateTime(latest.at)}
          </span>
        )}
      </div>

      {/* Alert Badge */}
      {alertStatus !== 'normal' && (
        <Badge
          variant={alertStatus === 'critical' ? 'destructive' : 'secondary'}
          className="text-[9px] font-bold"
        >
          {alertStatus === 'critical' ? 'CRITICAL' : 'WARNING'}
        </Badge>
      )}

      {/* Multi-sensor values */}
      {sensors.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {sensors.slice(1).map((sensor) => {
            const val = getLatestValue(sensor.reportType);
            return (
              <div
                key={sensor.reportType}
                className="p-2 rounded-lg bg-muted/30"
              >
                <p className="text-[8px] font-bold opacity-40 uppercase">
                  {sensor.label}
                </p>
                <p className="text-sm font-bold">
                  {val
                    ? typeof val.value === 'number'
                      ? val.value.toFixed(1)
                      : val.value
                    : '—'}
                  {sensor.unit && (
                    <span className="text-[10px] font-normal ml-0.5">
                      {sensor.unit}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Chart */}
      {chartData.length > 2 && chartType !== 'status' && (
        <div className="h-16 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.primary}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}