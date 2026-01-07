import { useState, useEffect, useRef } from 'react';
import type { TelemetryItem, RealtimeMetric, SSEState } from '@/pages/dashboard/monitoring/types';
import { resolveSensorInfo } from '@/lib/telemetry';
import { getSensorSeries, getReceiveCardSamples } from '@/services/telemetryApi';
import { gatewayOrigin, joinUrl } from '@/config/runtime';
import { useAuthStore } from '@/store/authStore';

const LRU_LIMIT = 500;
const REFRESH_INTERVAL = 1000;
const INITIAL_HISTORY_LIMIT = 50;

/**
 * Monitoring SSE Hook - 单设备实时数据订阅 + 历史数据预加载
 * @param selectedDeviceId 设备ID（number类型，契约要求）
 * @param historyRange 历史数据窗口（UTC ISO）
 */
export function useMonitoringSSE(
  selectedDeviceId: number | null,
  historyRange?: { from: string; to: string }
) {
  const [sseState, setSseState] = useState<SSEState>({
    metrics: {},
    lastUpdate: 0,
    status: 'idle',
    diagnostics: [],
  });

  const { isAuthenticated, clearAuth } = useAuthStore();
  const traceIdBuffer = useRef<Set<string>>(new Set());
  const pendingUpdates = useRef<Record<string, RealtimeMetric>>({});

  const historyFrom = historyRange?.from;
  const historyTo = historyRange?.to;

  useEffect(() => {
    // 单设备模式：必须选择设备才订阅
    if (selectedDeviceId === null || !isAuthenticated) {
      setSseState({
        metrics: {},
        lastUpdate: 0,
        status: 'idle',
        diagnostics: [],
      });
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    // --- 1. Fetch Seed Data (Initial History) ---
    const seedInitialData = async () => {
      try {
        const deviceIdStr = String(selectedDeviceId);
        
        // Parallel fetch for Sensor Series and Receive Card Samples
        const [sensorRes, cardRes] = await Promise.all([
          getSensorSeries({ 
            deviceId: selectedDeviceId,
            from: historyFrom,
            to: historyTo,
            limit: 300 // 获取足够多的点以分摊给各个传感器
          }),
          getReceiveCardSamples({ 
            deviceId: selectedDeviceId,
            from: historyFrom,
            to: historyTo,
            limit: 500 // 获取整个拓扑的最近状态
          })
        ]);

        if (!isMounted) return;

        const initialMetrics: Record<string, RealtimeMetric> = {};

        // A. Process Sensor History
        if (sensorRes.success && sensorRes.data) {
          sensorRes.data.forEach(point => {
            const metricKey = `${point.sourceType}:${point.reportType}${point.metricKey ? ':' + point.metricKey : ''}:${deviceIdStr}`;
            
            if (!initialMetrics[metricKey]) {
              initialMetrics[metricKey] = {
                value: point.value,
                at: point.at,
                sourceType: point.sourceType as any,
                reportType: point.reportType,
                metricKey,
                deviceId: deviceIdStr,
                history: [],
              };
            }
            
            // Only add numerical values to history
            if (typeof point.value === 'number') {
              initialMetrics[metricKey].history.push({ at: point.at, val: point.value });
            }
            
            // Ensure value/at is the latest in the series (assuming sorted or we check)
            if (new Date(point.at).getTime() > new Date(initialMetrics[metricKey].at).getTime()) {
              initialMetrics[metricKey].value = point.value;
              initialMetrics[metricKey].at = point.at;
            }
          });

          // Sort and trim history for each metric
          Object.values(initialMetrics).forEach(m => {
            m.history.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
            m.history = m.history.slice(-INITIAL_HISTORY_LIMIT);
          });
        }

        // B. Process Receive Card Latest State
        if (cardRes.success && cardRes.data && cardRes.data.length > 0) {
          const metricKey = `RECEIVE_CARD:bitErrorRate:${deviceIdStr}`;
          
          // Reconstruct nested structure from flattened samples
          // We only need the latest sample per (netPortNum, receiveCardNum)
          const latestCardMap = new Map<string, any>();
          cardRes.data.forEach(sample => {
            const key = `${sample.netPortNum}:${sample.receiveCardNum}`;
            const existing = latestCardMap.get(key);
            if (!existing || new Date(sample.at).getTime() > new Date(existing.at).getTime()) {
              latestCardMap.set(key, sample);
            }
          });

          // Group back into netPorts structure
          const portMap = new Map<number, any>();
          latestCardMap.forEach(sample => {
            if (!portMap.has(sample.netPortNum)) {
              portMap.set(sample.netPortNum, { netPortNum: sample.netPortNum, receiveCards: [] });
            }
            portMap.get(sample.netPortNum).receiveCards.push({
              receiveCardNum: sample.receiveCardNum,
              bitErrorRate: sample.bitErrorRate,
              temperature: sample.temperature,
              humidity: sample.humidity,
              smoke: sample.smoke,
              x: sample.x,
              y: sample.y
            });
          });

          const latestAt = cardRes.data.reduce((max, s) => 
            new Date(s.at).getTime() > new Date(max).getTime() ? s.at : max, 
            cardRes.data[0].at
          );

          initialMetrics[metricKey] = {
            value: Array.from(portMap.values()),
            at: latestAt,
            sourceType: 'RECEIVE_CARD' as any,
            reportType: 'bitErrorRate',
            metricKey,
            deviceId: deviceIdStr,
            history: [],
          };
        }

        setSseState(prev => ({
          ...prev,
          metrics: initialMetrics,
          lastUpdate: Date.now()
        }));

      } catch (err) {
        console.error('[SSE Monitoring] Failed to load initial history:', err);
      }
    };

    seedInitialData();

    // --- 2. Setup SSE Connection via Fetch ---
    const connectSSE = async () => {
      const url = joinUrl(gatewayOrigin, `/api/sse/monitoring/stream?deviceIds=${selectedDeviceId}`);
      
      try {
        const response = await fetch(url, {
          signal: abortController.signal,
          credentials: 'include',
          headers: {
            'Accept': 'text/event-stream',
          },
        });

        if (response.status === 401 || response.status === 403) {
          console.warn('[SSE Monitoring] Auth failed (401/403), clearing auth');
          clearAuth();
          return;
        }

        if (!response.ok) {
          throw new Error(`SSE request failed with status ${response.status}`);
        }

        setSseState((prev) => ({ ...prev, status: 'connected' }));

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
            
            const data = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
            
            try {
              const envelope = JSON.parse(data);
              // 契约：msg.type === 'telemetry.sensor.reported'
              if (envelope.type === 'telemetry.sensor.reported') {
                // De-duplication
                if (envelope.traceId && traceIdBuffer.current.has(envelope.traceId)) continue;
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
                  continue;
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
              console.error('[SSE Monitoring] Failed to parse message:', e);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('[SSE Monitoring] Connection aborted');
        } else {
          console.error('[SSE Monitoring] Connection error:', err);
          if (isMounted) setSseState((prev) => ({ ...prev, status: 'error' }));
        }
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [selectedDeviceId, historyFrom, historyTo, isAuthenticated]);

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
