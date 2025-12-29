import { useState, useEffect, useRef } from 'react';
import type { TelemetryItem, RealtimeMetric, SSEState } from '@/pages/dashboard/monitoring/types';
import { resolveSensorInfo } from '@/lib/telemetry';

const LRU_LIMIT = 500;
const REFRESH_INTERVAL = 1000;

export function useMonitoringSSE(selectedDeviceIds: string[]) {
  const [sseState, setSseState] = useState<SSEState>({
    metrics: {},
    lastUpdate: 0,
    status: 'idle',
    diagnostics: [],
  });

  const traceIdBuffer = useRef<Set<string>>(new Set());
  const pendingUpdates = useRef<Record<string, RealtimeMetric>>({});

  useEffect(() => {
    if (selectedDeviceIds.length === 0) {
      setSseState((prev) => ({ ...prev, status: 'idle', metrics: {} }));
      return;
    }

    const url = `/api/sse/monitoring/stream?deviceIds=${selectedDeviceIds.join(',')}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    setSseState((prev) => ({ ...prev, status: 'connected' }));

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'telemetry.sensor.reported') {
          // De-duplication
          if (envelope.traceId && traceIdBuffer.current.has(envelope.traceId)) return;
          if (envelope.traceId) {
            traceIdBuffer.current.add(envelope.traceId);
            if (traceIdBuffer.current.size > LRU_LIMIT) {
              const iterator = traceIdBuffer.current.values();
              const first = iterator.next().value;
              if (first !== undefined) {
                traceIdBuffer.current.delete(first);
              }
            }
          }

          const items = (envelope.data?.items || []) as TelemetryItem[];

          items.forEach((item) => {
            const deviceId = item.deviceId || envelope.deviceId || 'unknown';
            const sensorType = item.sensorType;
            const sensorId = item.sensorId;

            // Use the new utility to resolve sensor info
            const { sourceType, reportType } = resolveSensorInfo(sensorType, sensorId);

            const metricKey = `${sourceType}:${reportType}:${deviceId}`;

            const val = item.sensorValue !== undefined ? item.sensorValue : item;
            const numVal = typeof val === 'number' ? val : 0;

            const existing = pendingUpdates.current[metricKey] || sseState.metrics[metricKey];
            const history = existing?.history || [];
            const newHistory = [...history, { at: envelope.occurredAt, val: numVal }].slice(-30);

            pendingUpdates.current[metricKey] = {
              value: val,
              at: envelope.occurredAt,
              sourceType,
              reportType,
              metricKey,
              deviceId,
              history: newHistory,
              traceId: envelope.traceId,
            };
          });

          // Diagnostics
          if (envelope.traceId) {
            setSseState((prev) => ({
              ...prev,
              diagnostics: [
                { traceId: envelope.traceId, occurredAt: envelope.occurredAt },
                ...prev.diagnostics,
              ].slice(0, 20),
            }));
          }
        }
      } catch (e) {
        console.error('[SSE Monitoring] Error', e);
      }
    });

    eventSource.onerror = () => {
      setSseState((prev) => ({ ...prev, status: 'error' }));
    };

    return () => {
      eventSource.close();
    };
  }, [selectedDeviceIds]);

  // Throttled UI Update
  useEffect(() => {
    const timer = setInterval(() => {
      if (Object.keys(pendingUpdates.current).length > 0) {
        setSseState((prev) => ({
          ...prev,
          metrics: { ...prev.metrics, ...pendingUpdates.current },
          lastUpdate: Date.now(),
        }));
        pendingUpdates.current = {};
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return sseState;
}

