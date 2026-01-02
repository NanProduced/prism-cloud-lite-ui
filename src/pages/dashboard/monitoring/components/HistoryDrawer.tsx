import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  LineChart as LineChartIcon,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getSensorSeries, getReceiveCardSamples } from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import type { HistoryDrawerProps } from '../types';
import { CHART_COLORS } from '../constants';

export function HistoryDrawer({
  open,
  onClose,
  deviceId,
  reportType,
  sourceType,
  metricKeys,
  title,
  isReceiveCard,
  netPortNum,
  receiveCardNum,
  defaultFromIso,
  defaultToIso,
}: HistoryDrawerProps) {
  const { formatDateTime } = useTimeFormatter();

  const toLocalInputValue = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const isoToLocalInputValue = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return toLocalInputValue(d);
  };

  // Time range state
  const [timeRange, setTimeRange] = useState(() => ({
    from: toLocalInputValue(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    to: toLocalInputValue(new Date()),
  }));

  useEffect(() => {
    if (!open) return;
    const nextFrom = isoToLocalInputValue(defaultFromIso);
    const nextTo = isoToLocalInputValue(defaultToIso);
    if (!nextFrom || !nextTo) return;
    setTimeRange({ from: nextFrom, to: nextTo });
  }, [open, defaultFromIso, defaultToIso]);

  // Receive card selectors
  const [selectedPort, setSelectedPort] = useState<number | undefined>(netPortNum);
  const [selectedCard, setSelectedCard] = useState<number | undefined>(receiveCardNum);

  // Parse time range to ISO
  const fromIso = useMemo(() => new Date(timeRange.from).toISOString(), [timeRange.from]);
  const toIso = useMemo(() => new Date(timeRange.to).toISOString(), [timeRange.to]);

  // Query for sensor series
  const {
    data: sensorRes,
    isLoading: isSensorLoading,
    refetch: refetchSensor,
  } = useQuery({
    queryKey: ['telemetry', 'sensors', 'series', deviceId, reportType, sourceType, fromIso, toIso, metricKeys],
    queryFn: () =>
      getSensorSeries({
        deviceId,
        reportTypes: [reportType],
        sourceType,
        metricKeys,
        from: fromIso,
        to: toIso,
        limit: 10000,
      }),
    enabled: open && !isReceiveCard && !!deviceId,
  });

  // Query for receive card samples
  const {
    data: receiveCardRes,
    isLoading: isReceiveCardLoading,
    refetch: refetchReceiveCard,
  } = useQuery({
    queryKey: [
      'telemetry',
      'receive-cards',
      'samples',
      deviceId,
      selectedPort,
      selectedCard,
      fromIso,
      toIso,
    ],
    queryFn: () =>
      getReceiveCardSamples({
        deviceId,
        netPortNum: selectedPort,
        receiveCardNum: selectedCard,
        from: fromIso,
        to: toIso,
        limit: 10000,
      }),
    enabled:
      open && isReceiveCard && !!deviceId && selectedPort !== undefined && selectedCard !== undefined,
  });

  const isLoading = isSensorLoading || isReceiveCardLoading;
  const data = isReceiveCard ? receiveCardRes?.data || [] : sensorRes?.data || [];

  // Determine chart data keys
  const chartKeys = useMemo(() => {
    if (isReceiveCard) {
      return [
        { key: 'temperature', name: 'Temperature', color: CHART_COLORS.temperature, unit: '°C' },
        { key: 'humidity', name: 'Humidity', color: CHART_COLORS.humidity, unit: '%' },
        { key: 'bitErrorRate', name: 'Bit Error Rate', color: CHART_COLORS.smoke, unit: '' },
      ];
    }

    // For brightness with multiple metrics
    if (reportType === 'bright' && metricKeys && metricKeys.length > 1) {
      return metricKeys.map((key, i) => ({
        key,
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        color: Object.values(CHART_COLORS)[i % Object.values(CHART_COLORS).length],
        unit: key === 'sensorBrightValue' ? 'lux' : '',
      }));
    }

    // Default single value
    return [
      {
        key: 'value',
        name: title,
        color: CHART_COLORS.primary,
        unit: '',
      },
    ];
  }, [isReceiveCard, reportType, metricKeys, title]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // For receive card data, it's already in the right format
    if (isReceiveCard) {
      return data;
    }

    // For sensor series, group by timestamp
    const grouped: Record<string, Record<string, number>> = {};

    (data as any[]).forEach((point) => {
      const at = point.at;
      if (!grouped[at]) {
        grouped[at] = { at };
      }

      // Use metricKey if available, otherwise 'value'
      const key = point.metricKey || 'value';
      grouped[at][key] = point.value;
    });

    return Object.values(grouped).sort(
      (a, b) => new Date(a.at as string).getTime() - new Date(b.at as string).getTime()
    );
  }, [data, isReceiveCard]);

  // Stats calculation
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const primaryKey = chartKeys[0]?.key || 'value';
    const values = chartData
      .map((d) => d[primaryKey])
      .filter((v) => typeof v === 'number') as number[];

    if (values.length === 0) return null;

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    };
  }, [chartData, chartKeys]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                <LineChartIcon className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                  {sourceType} | Device: {deviceId}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Controls */}
        <div className="p-4 border-b bg-muted/5 space-y-3">
          {/* Time Range */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="datetime-local"
              value={timeRange.from}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, from: e.target.value }))}
              className="h-8 w-44 text-[10px] font-bold"
            />
            <span className="text-[10px] font-bold text-muted-foreground">TO</span>
            <Input
              type="datetime-local"
              value={timeRange.to}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, to: e.target.value }))}
              className="h-8 w-44 text-[10px] font-bold"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => (isReceiveCard ? refetchReceiveCard() : refetchSensor())}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {/* Receive Card Selectors */}
          {isReceiveCard && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedPort?.toString() || ''}
                onValueChange={(val) => setSelectedPort(Number(val))}
              >
                <SelectTrigger className="h-8 w-28 text-[10px] font-bold">
                  <SelectValue placeholder="Port" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((port) => (
                    <SelectItem key={port} value={port.toString()} className="text-[10px]">
                      Port {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedCard?.toString() || ''}
                onValueChange={(val) => setSelectedCard(Number(val))}
              >
                <SelectTrigger className="h-8 w-28 text-[10px] font-bold">
                  <SelectValue placeholder="Card" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 32 }, (_, i) => i).map((card) => (
                    <SelectItem key={card} value={card.toString()} className="text-[10px]">
                      Card {card}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Loading data...
                </p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center opacity-40">
                <LineChartIcon className="h-12 w-12 mx-auto mb-3" />
                <p className="text-sm font-bold">No Historical Data</p>
                <p className="text-[10px] mt-1">
                  {isReceiveCard && (selectedPort === undefined || selectedCard === undefined)
                    ? 'Please select a port and card to view data'
                    : 'No data found for the selected time range'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-lg font-bold tracking-tighter tabular-nums">
                      {stats.min.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-40">Min</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-lg font-bold tracking-tighter tabular-nums">
                      {stats.max.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-40">Max</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-lg font-bold tracking-tighter tabular-nums">
                      {stats.avg.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-40">Avg</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-lg font-bold tracking-tighter tabular-nums">
                      {stats.count}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-40">Points</p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {chartKeys.map((k) => (
                        <linearGradient
                          key={k.key}
                          id={`color-${k.key}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={k.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={k.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="at"
                      fontSize={9}
                      tickFormatter={(val) => new Date(val).toLocaleTimeString()}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      labelFormatter={(val) => formatDateTime(val)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                        fontSize: '10px',
                        padding: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                    {chartKeys.map((k) => (
                      <Area
                        key={k.key}
                        type="monotone"
                        dataKey={k.key}
                        name={k.name}
                        stroke={k.color}
                        fill={`url(#color-${k.key})`}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Data Point Count */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {chartData.length > 10000 && (
                    <Badge variant="outline" className="text-[9px] mr-2">
                      Downsampled
                    </Badge>
                  )}
                  {chartData.length.toLocaleString()} data points
                </span>
                <span>
                  {new Date(chartData[0]?.at).toLocaleString()} -{' '}
                  {new Date(chartData[chartData.length - 1]?.at).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
