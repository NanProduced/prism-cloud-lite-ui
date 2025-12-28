import { useMemo } from 'react';
import { ToggleLeft, ToggleRight, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RealtimeMetric } from '../types';

interface RelayCardProps {
  metrics: Record<string, RealtimeMetric>;
  className?: string;
}

interface RelayState {
  status: boolean | null;
  delay: number | null;
  statusAt: string | null;
  delayAt: string | null;
}

export function RelayCard({ metrics, className }: RelayCardProps) {
  // Extract relay data from metrics
  const relayData = useMemo(() => {
    const relays: Record<string, RelayState> = {
      '1': { status: null, delay: null, statusAt: null, delayAt: null },
      '2': { status: null, delay: null, statusAt: null, delayAt: null },
      '3': { status: null, delay: null, statusAt: null, delayAt: null },
    };

    Object.values(metrics).forEach((metric) => {
      const { reportType, value, at } = metric;

      // Relay Status
      if (reportType === 'relayStatus') {
        relays['1'].status = value === 1 || value === true;
        relays['1'].statusAt = at;
      } else if (reportType === 'relayStatus2') {
        relays['2'].status = value === 1 || value === true;
        relays['2'].statusAt = at;
      } else if (reportType === 'relayStatus3') {
        relays['3'].status = value === 1 || value === true;
        relays['3'].statusAt = at;
      }

      // Relay Delay
      if (reportType === 'relayDelay') {
        relays['1'].delay = typeof value === 'number' ? value : null;
        relays['1'].delayAt = at;
      } else if (reportType === 'relayDelay2') {
        relays['2'].delay = typeof value === 'number' ? value : null;
        relays['2'].delayAt = at;
      } else if (reportType === 'relayDelay3') {
        relays['3'].delay = typeof value === 'number' ? value : null;
        relays['3'].delayAt = at;
      }
    });

    return relays;
  }, [metrics]);

  // Check if we have any relay data
  const hasData = Object.values(relayData).some(
    (r) => r.status !== null || r.delay !== null
  );

  // Get active relays
  const activeRelays = Object.entries(relayData).filter(
    ([, r]) => r.status !== null || r.delay !== null
  );

  return (
    <Card
      className={cn(
        'rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden',
        className
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Zap className="h-4 w-4 text-violet-500" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-widest">
            Relay Control
          </CardTitle>
        </div>
        {hasData && (
          <Badge variant="outline" className="text-[9px] font-bold">
            {activeRelays.filter(([, r]) => r.status === true).length} ACTIVE
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
            <ToggleLeft className="h-8 w-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No Relay Data
            </p>
            <p className="text-[9px] mt-1">
              Waiting for relay status telemetry...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Relay Status Grid */}
            <div className="grid grid-cols-3 gap-2">
              {(['1', '2', '3'] as const).map((num) => {
                const relay = relayData[num];
                const isOn = relay.status === true;
                const hasStatus = relay.status !== null;

                return (
                  <div
                    key={num}
                    className={cn(
                      'p-3 rounded-xl transition-all',
                      hasStatus
                        ? isOn
                          ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'bg-muted/50'
                        : 'bg-muted/20 opacity-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase">
                        Relay {num}
                      </span>
                      {hasStatus ? (
                        isOn ? (
                          <ToggleRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )
                      ) : (
                        <span className="text-[9px] text-muted-foreground">—</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] opacity-50">Status</span>
                        {hasStatus ? (
                          <Badge
                            variant={isOn ? 'default' : 'secondary'}
                            className={cn(
                              'text-[8px] h-4 px-1.5',
                              isOn && 'bg-emerald-500'
                            )}
                          >
                            {isOn ? 'ON' : 'OFF'}
                          </Badge>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </div>

                      {/* Delay */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] opacity-50 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          Delay
                        </span>
                        {relay.delay !== null ? (
                          <span className="text-[9px] font-bold tabular-nums">
                            {relay.delay}ms
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Last Update */}
            {activeRelays.length > 0 && (
              <div className="text-[9px] text-muted-foreground text-right">
                Last update:{' '}
                {new Date(
                  Math.max(
                    ...activeRelays
                      .map(([, r]) => [r.statusAt, r.delayAt])
                      .flat()
                      .filter(Boolean)
                      .map((t) => new Date(t!).getTime())
                  )
                ).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
