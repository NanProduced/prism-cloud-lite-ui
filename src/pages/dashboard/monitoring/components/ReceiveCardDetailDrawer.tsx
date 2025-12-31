import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Cpu, Thermometer, Droplets, TrendingUp, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getReceiveCardSamples } from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { CHART_COLORS } from '../constants';
import type { ReceiveCardTile } from './ReceiveCardTopology';

interface ReceiveCardDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  deviceId: number;
  card: ReceiveCardTile | null;
  defaultFromIso?: string;
  defaultToIso?: string;
}

// 时间范围选项
const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
] as const;

export function ReceiveCardDetailDrawer({
  open,
  onClose,
  deviceId,
  card,
  defaultFromIso,
  defaultToIso,
}: ReceiveCardDetailDrawerProps) {
  const { formatDateTime } = useTimeFormatter();
  const [selectedRange, setSelectedRange] = useState<number>(24); // 默认24小时
  const [mode, setMode] = useState<'preset' | 'range'>('preset');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!defaultFromIso || !defaultToIso) return;
    setMode('range');
    setCustomRange({ from: defaultFromIso, to: defaultToIso });
  }, [open, defaultFromIso, defaultToIso]);

  // 计算时间范围
  const timeRange = useMemo(() => {
    if (mode === 'range' && customRange) return customRange;
    const now = new Date();
    const from = new Date(now.getTime() - selectedRange * 60 * 60 * 1000);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  }, [mode, customRange, selectedRange]);

  // 查询历史数据
  const { data: historyRes, isLoading } = useQuery({
    queryKey: [
      'telemetry',
      'receive-cards',
      'samples',
      deviceId,
      card?.netPortNum,
      card?.receiveCardNum,
      timeRange.from,
      timeRange.to,
    ],
    queryFn: () =>
      getReceiveCardSamples({
        deviceId: String(deviceId),
        netPortNum: card!.netPortNum,
        receiveCardNum: card!.receiveCardNum,
        from: timeRange.from,
        to: timeRange.to,
        limit: 200,
      }),
    enabled: open && !!card,
    refetchInterval: 30000, // 30秒刷新
  });

  const historyData = historyRes?.data || [];

  if (!card) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 pb-3 border-b bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-indigo-500/10">
                <Cpu className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold">
                  Port {card.netPortNum} · Card {card.receiveCardNum}
                </SheetTitle>
                <p className="text-[10px] font-mono text-muted-foreground">
                  Device ID: {deviceId}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* 当前值 */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-lg border bg-card shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Bit Error Rate
                </p>
                <p className="text-lg font-bold tracking-tight tabular-nums text-indigo-600">
                  {card.bitErrorRate.toFixed(6)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Thermometer className="h-3 w-3 text-rose-500" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Temp
                  </p>
                </div>
                <p className="text-lg font-bold tracking-tight tabular-nums">
                  {card.temperature}°C
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Humidity
                  </p>
                </div>
                <p className="text-lg font-bold tracking-tight tabular-nums">
                  {card.humidity}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 时间范围选择 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                History
              </span>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
              {defaultFromIso && defaultToIso && (
                <Button
                  variant={mode === 'range' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 text-[9px] font-bold rounded-sm px-2.5"
                  onClick={() => {
                    setMode('range');
                    setCustomRange({ from: defaultFromIso, to: defaultToIso });
                  }}
                >
                  Custom
                </Button>
              )}
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.hours}
                  variant={mode === 'preset' && selectedRange === range.hours ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 text-[9px] font-bold rounded-sm px-2.5"
                  onClick={() => {
                    setMode('preset');
                    setCustomRange(null);
                    setSelectedRange(range.hours);
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* BER 趋势图 */}
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Bit Error Rate Trend
              </p>
              <div className="h-[140px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 animate-pulse">
                    Loading...
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="at"
                        fontSize={8}
                        tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.toExponential(1)}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        labelFormatter={(val) => formatDateTime(val)}
                        formatter={(value: number) => [value.toFixed(6), 'BER']}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '10px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bitErrorRate"
                        name="BER"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 温湿度趋势图 */}
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Temperature & Humidity
              </p>
              <div className="h-[140px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 animate-pulse">
                    Loading...
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="at"
                        fontSize={8}
                        tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                        name="Temp (°C)"
                        stroke={CHART_COLORS.temperature}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="humidity"
                        name="Humidity (%)"
                        stroke={CHART_COLORS.humidity}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 最后更新时间 */}
          {historyData.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-muted-foreground/50">
              <Clock className="h-3 w-3" />
              <span>
                Last sample: {formatDateTime(historyData[historyData.length - 1]?.at)}
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
