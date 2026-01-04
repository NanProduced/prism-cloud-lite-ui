import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  ChevronRight,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Cable,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getReceiveCardSamples } from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import type { RealtimeMetric, ReceiveCardPortData, ReceiveCardData } from '../types';
import { CHART_COLORS } from '../constants';

interface ReceiveCardSectionProps {
  deviceId: number;  // 单设备模式
  metrics: Record<string, RealtimeMetric>;
  className?: string;
}

import { useTranslation } from 'react-i18next';

export function ReceiveCardSection({
  deviceId,
  metrics,
  className,
}: ReceiveCardSectionProps) {
  const { t } = useTranslation();
  const { formatDateTime } = useTimeFormatter();
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Extract receive card data from metrics
  const receiveCardData = useMemo(() => {
    const result: Record<string, ReceiveCardPortData[]> = {};

    Object.values(metrics).forEach((metric) => {
      if (metric.reportType !== 'bitErrorRate' && metric.reportType !== 'receiveCard') return;

      const deviceId = metric.deviceId || metric.metricKey;
      const value = metric.value;

      // Handle nested array structure
      let ports: ReceiveCardPortData[] = [];
      if (Array.isArray(value)) {
        ports = value as ReceiveCardPortData[];
      } else if (value?.sensorValue && Array.isArray(value.sensorValue)) {
        ports = value.sensorValue as ReceiveCardPortData[];
      }

      if (ports.length > 0) {
        result[deviceId] = ports;
      }
    });

    return result;
  }, [metrics]);

  // Get data for current device (单设备模式)
  const currentDeviceData = receiveCardData[String(deviceId)] || [];

  // Calculate summary
  const summary = useMemo(() => {
    let totalCards = 0;
    let totalPorts = 0;
    let hasWarning = false;
    let hasCritical = false;

    Object.values(receiveCardData).forEach((ports) => {
      totalPorts += ports.length;
      ports.forEach((port) => {
        totalCards += port.receiveCards?.length || 0;
        port.receiveCards?.forEach((card) => {
          if (card.bitErrorRate > 0.001) hasCritical = true;
          else if (card.bitErrorRate > 0.0001) hasWarning = true;
          if (card.temperature > 50) hasWarning = true;
          if (card.temperature > 60) hasCritical = true;
        });
      });
    });

    return {
      totalCards,
      totalPorts,
      status: hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy',
    };
  }, [receiveCardData]);

  // Available ports for selection
  const availablePorts = useMemo(() => {
    return currentDeviceData.map((p) => p.netPortNum);
  }, [currentDeviceData]);

  // Available cards for selected port
  const availableCards = useMemo(() => {
    if (selectedPort === null) return [];
    const port = currentDeviceData.find((p) => p.netPortNum === selectedPort);
    return port?.receiveCards?.map((c) => c.receiveCardNum) || [];
  }, [currentDeviceData, selectedPort]);

  // History query (only when port and card are selected)
  const { data: historyRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: [
      'telemetry',
      'receive-cards',
      'samples',
      deviceId,
      selectedPort,
      selectedCard,
    ],
    queryFn: () =>
      getReceiveCardSamples({
        deviceId: String(deviceId),
        netPortNum: selectedPort!,
        receiveCardNum: selectedCard!,
        limit: 100,
      }),
    enabled:
      showHistory &&
      deviceId !== null &&
      selectedPort !== null &&
      selectedCard !== null,
  });

  const historyData = historyRes?.data || [];

  // Get card health status
  const getCardStatus = (card: ReceiveCardData): 'healthy' | 'warning' | 'critical' => {
    if (card.bitErrorRate > 0.001 || card.temperature > 60) return 'critical';
    if (card.bitErrorRate > 0.0001 || card.temperature > 50) return 'warning';
    return 'healthy';
  };

  const statusColors: Record<string, string> = {
    healthy: 'text-emerald-500 bg-emerald-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    critical: 'text-rose-500 bg-rose-500/10',
  };

  const statusIcons = {
    healthy: CheckCircle2,
    warning: AlertTriangle,
    critical: AlertTriangle,
  };

  const hasData = Object.keys(receiveCardData).length > 0;

  return (
    <Card
      className={cn(
        'rounded-lg border bg-card shadow-sm overflow-hidden',
        className
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10">
            <Cpu className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground/70">
            {t('monitoring.tabs.receiveCard')}
          </CardTitle>
        </div>
        {hasData && (
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-bold h-5 px-2 rounded-full',
              statusColors[summary.status]
            )}
          >
            {summary.status.toUpperCase()}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
            <Cpu className="h-8 w-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              {t('monitoring.status.awaitingData')}
            </p>
          </div>
        ) : !showHistory ? (
          // Summary View
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 text-center border">
                <p className="text-xl font-bold tracking-tight">
                  {summary.totalCards}
                </p>
                <p className="text-[9px] font-bold uppercase opacity-40">{t('monitoring.receiveCard.cards')}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center border">
                <p className="text-xl font-bold tracking-tight">
                  {summary.totalPorts}
                </p>
                <p className="text-[9px] font-bold uppercase opacity-40">Ports</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center border">
                <p className="text-xl font-bold tracking-tight">
                  {Object.keys(receiveCardData).length}
                </p>
                <p className="text-[9px] font-bold uppercase opacity-40">{t('monitoring.devices')}</p>
              </div>
            </div>

            {/* Port/Card Grid - 单设备模式，无需设备选择器 */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {currentDeviceData.map((port) => (
                  <div key={port.netPortNum} className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                      <Cable className="h-3 w-3" />
                      Port {port.netPortNum}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pl-5">
                      {port.receiveCards?.map((card) => {
                        const status = getCardStatus(card);
                        const StatusIcon = statusIcons[status];
                        return (
                          <button
                            key={card.receiveCardNum}
                            onClick={() => {
                              setSelectedPort(port.netPortNum);
                              setSelectedCard(card.receiveCardNum);
                              setShowHistory(true);
                            }}
                            className={cn(
                              'p-2 rounded-md text-left transition-all border hover:border-primary/50',
                              statusColors[status]
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold">
                                Card {card.receiveCardNum}
                              </span>
                              <StatusIcon className="h-3 w-3" />
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[8px]">
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-2.5 w-2.5 opacity-50" />
                                {card.temperature}°C
                              </div>
                              <div className="flex items-center gap-1">
                                <Droplets className="h-2.5 w-2.5 opacity-50" />
                                {card.humidity}%
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // History View (Drill-down)
          <div className="space-y-4">
            {/* Back Button & Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] font-bold rounded-md"
                onClick={() => setShowHistory(false)}
              >
                ← {t('common.actions.back')}
              </Button>

              <Select
                value={selectedPort?.toString() || ''}
                onValueChange={(val) => {
                  setSelectedPort(Number(val));
                  setSelectedCard(null);
                }}
              >
                <SelectTrigger className="h-7 w-24 text-[10px] font-bold rounded-md">
                  <SelectValue placeholder="Port" />
                </SelectTrigger>
                <SelectContent>
                  {availablePorts.map((port) => (
                    <SelectItem
                      key={port}
                      value={port.toString()}
                      className="text-[10px]"
                    >
                      Port {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCard?.toString() || ''}
                onValueChange={(val) => setSelectedCard(Number(val))}
                disabled={selectedPort === null}
              >
                <SelectTrigger className="h-7 w-24 text-[10px] font-bold rounded-md">
                  <SelectValue placeholder="Card" />
                </SelectTrigger>
                <SelectContent>
                  {availableCards.map((card) => (
                    <SelectItem
                      key={card}
                      value={card.toString()}
                      className="text-[10px]"
                    >
                      Card {card}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* History Chart */}
            {selectedPort !== null && selectedCard !== null ? (
              isHistoryLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-[10px] font-bold opacity-40 animate-pulse">
                    {t('monitoring.history.loading')}
                  </p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-[10px] font-bold opacity-40">
                    {t('monitoring.history.noData')}
                  </p>
                </div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="at"
                        fontSize={8}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleTimeString()
                        }
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        labelFormatter={(val) => formatDateTime(val)}
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '10px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '9px' }}
                        iconSize={8}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temperature"
                        name={`${t('monitoring.receiveCard.temp')} (°C)`}
                        stroke={CHART_COLORS.temperature}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="humidity"
                        name={`${t('monitoring.receiveCard.humidity')} (%)`}
                        stroke={CHART_COLORS.humidity}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="bitErrorRate"
                        name="BER"
                        stroke={CHART_COLORS.smoke}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
                <Layers className="h-8 w-8 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {t('monitoring.history.selectHint')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
