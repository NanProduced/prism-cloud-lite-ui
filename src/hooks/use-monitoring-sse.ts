import { useState, useEffect, useRef } from 'react';
import type { TelemetryItem, RealtimeMetric, SSEState } from '@/pages/dashboard/monitoring/types';
import { resolveSensorInfo } from '@/lib/telemetry';

const LRU_LIMIT = 500;
const REFRESH_INTERVAL = 1000;

/**
 * Monitoring SSE Hook - 单设备实时数据订阅
 * @param selectedDeviceId 设备ID（number类型，契约要求）
 */
export function useMonitoringSSE(selectedDeviceId: number | null) {
  const [sseState, setSseState] = useState<SSEState>({
    metrics: {},
    lastUpdate: 0,
    status: 'idle',
    diagnostics: [],
  });

  const traceIdBuffer = useRef<Set<string>>(new Set());
  const pendingUpdates = useRef<Record<string, RealtimeMetric>>({});

  useEffect(() => {
    // 单设备模式：必须选择设备才订阅
    if (selectedDeviceId === null) {
      setSseState((prev) => ({ ...prev, status: 'idle', metrics: {} }));
      return;
    }

    // SSE 契约：deviceIds 参数使用 Long 类型
    const url = `/api/sse/monitoring/stream?deviceIds=${selectedDeviceId}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    setSseState((prev) => ({ ...prev, status: 'connected' }));

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        // 契约：msg.type === 'telemetry.sensor.reported'
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

          // 契约：设备归属从 msg.scope.deviceId 获取（不是 envelope.deviceId）
          const scopeDeviceId = envelope.scope?.deviceId;
          if (!scopeDeviceId) {
            console.warn('[SSE Monitoring] Missing scope.deviceId in envelope', envelope);
            return;
          }

          const items = (envelope.data?.items || []) as TelemetryItem[];

          items.forEach((item) => {
            // 使用 scope.deviceId 作为设备归属
            const deviceId = String(scopeDeviceId);
            const sensorType = item.sensorType;
            const sensorId = item.sensorId;

            // 特殊处理1: 接收卡（bitErrorRate）- 嵌套数组结构
            if (sensorType === 'bitErrorRate') {
              const metricKey = `RECEIVE_CARD:bitErrorRate:${deviceId}`;
              // 保存完整的嵌套结构，不展平
              pendingUpdates.current[metricKey] = {
                value: item.sensorValue, // 保持原始数组结构
                at: envelope.occurredAt,
                sourceType: 'RECEIVE_CARD' as any, // 独立数据源
                reportType: 'bitErrorRate',
                metricKey,
                deviceId,
                history: [], // 接收卡不维护 history（结构复杂，用 HTTP 查历史）
                traceId: envelope.traceId,
              };
              return;
            }

            // 特殊处理2: 亮度（bright）- 多指标字段
            if (sensorType === 'bright') {
              const { sourceType } = resolveSensorInfo(sensorType, sensorId);
              const brightMetrics = {
                masterBrightValue: item.masterBrightValue,
                screenBrightValue: item.screenBrightValue,
                sensorBrightValue: item.sensorBrightValue,
              };

              // 为每个有效指标创建独立的 metric entry
              Object.entries(brightMetrics).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                  const metricKey = `${sourceType}:bright:${key}:${deviceId}`;
                  const existing = pendingUpdates.current[metricKey] || sseState.metrics[metricKey];
                  const history = existing?.history || [];
                  const newHistory = [...history, { at: envelope.occurredAt, val: val as number }].slice(-30);

                  pendingUpdates.current[metricKey] = {
                    value: val,
                    at: envelope.occurredAt,
                    sourceType,
                    reportType: 'bright',
                    metricKey,
                    deviceId,
                    history: newHistory,
                    traceId: envelope.traceId,
                  };
                }
              });
              return;
            }

            // 通用传感器处理：单值 sensorValue
            const { sourceType, reportType } = resolveSensorInfo(sensorType, sensorId);
            const metricKey = `${sourceType}:${reportType}:${deviceId}`;
            const val = item.sensorValue;

            // 只有数值类型才写入 history
            const numVal = typeof val === 'number' ? val : null;

            const existing = pendingUpdates.current[metricKey] || sseState.metrics[metricKey];
            const history = existing?.history || [];
            const newHistory = numVal !== null
              ? [...history, { at: envelope.occurredAt, val: numVal }].slice(-30)
              : history;

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
  }, [selectedDeviceId]);

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

