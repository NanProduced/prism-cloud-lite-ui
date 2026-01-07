import { useMessageStore } from '@/store/messageStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { renderMessage } from '@/lib/message-renderer';
import type { MessageListItem, SSEEventEnvelope } from '@/types/message';
import { defaultNotificationSettings } from '@/types/notificationSettings';
import { gatewayOrigin, joinUrl } from '@/config/runtime';

class SSEManager {
  private abortController: AbortController | null = null;
  private reconnectTimeout: number | null = null;
  private userId: string | null = null;
  private lastToastAt: Map<string, number> = new Map();

  async connect(userId: string) {
    if (this.abortController && this.userId === userId) return;
    
    this.userId = userId;
    this.disconnect();

    const url = joinUrl(gatewayOrigin, '/api/sse/stream');
    console.log('[SSE] Connecting to:', url);

    this.abortController = new AbortController();

    try {
      const response = await fetch(url, {
        signal: this.abortController.signal,
        credentials: 'include',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`SSE request failed with status ${response.status}`);
      }

      useMessageStore.getState().setSseConnected(true);
      console.log('[SSE] Connection opened');

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
            const payload = JSON.parse(data) as SSEEventEnvelope;
            this.handleEvent(payload);
          } catch (e) {
            console.error('[SSE] Failed to parse message:', data, e);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[SSE] Connection aborted');
      } else {
        console.error('[SSE] Connection error:', error);
        useMessageStore.getState().setSseConnected(false);
        this.scheduleReconnect();
      }
    }
  }

  private handleEvent(envelope: SSEEventEnvelope) {
    if (!envelope.success) return;

    console.log(`[SSE] Received event: ${envelope.type}`, envelope.data);

    switch (envelope.type) {
      case 'message.created':
      case 'message.updated':
        if (envelope.data.message) {
          const incomingMessage = envelope.data.message as MessageListItem;
          const prev = useMessageStore.getState().recentMessages.find((m) => m.id === incomingMessage.id);

          useMessageStore.getState().upsertMessage(incomingMessage);
          // Refresh unread count to be accurate
          useMessageStore.getState().fetchInitialData();

          this.maybeToastMessage(envelope.type, incomingMessage, prev?.status);
          // Dispatch custom event for page-level refresh
          window.dispatchEvent(new CustomEvent(`prism.${envelope.type}`, { detail: envelope.data.message }));
        }
        break;
      
      case 'subscription.updated':
        // Notify other stores if needed
        window.dispatchEvent(new CustomEvent('prism.subscription.updated', { detail: envelope.data }));
        break;

      case 'device.status.changed':
        // Keep backward compat (some pages only listen to prism.device.updated)
        window.dispatchEvent(new CustomEvent('prism.device.updated', { detail: envelope.scope }));
        window.dispatchEvent(new CustomEvent('prism.device.status.changed', { detail: envelope.scope }));
        break;

      case 'device.updated':
        window.dispatchEvent(new CustomEvent('prism.device.updated', { detail: envelope.scope }));
        break;

      case 'telemetry.gps.reported':
        window.dispatchEvent(new CustomEvent('prism.telemetry.gps.reported', { 
          detail: { scope: envelope.scope, data: envelope.data, occurredAt: envelope.occurredAt } 
        }));
        break;

      case 'operation.updated':
        window.dispatchEvent(new CustomEvent('prism.operation.updated', { 
          detail: { scope: envelope.scope, data: envelope.data } 
        }));
        break;

      default:
        console.warn(`[SSE] Unhandled event type: ${envelope.type}`);
    }
  }

  private maybeToastMessage(eventType: string, message: MessageListItem, prevStatus?: MessageListItem['status']) {
    const settings = useSettingsStore.getState().notificationSettings ?? defaultNotificationSettings;
    const toastSettings = settings.toast;

    if (!toastSettings.enabled) return;
    if (eventType === 'message.created' && !toastSettings.triggerOnCreated) return;
    if (eventType === 'message.updated' && !toastSettings.triggerOnUpdated) return;

    if (!toastSettings.kinds.includes(message.kind)) return;

    if (toastSettings.statuses.length > 0 && message.status && !toastSettings.statuses.includes(message.status)) {
      return;
    }

    // On update, only notify when status changes (avoid readAt/payload-only updates)
    if (eventType === 'message.updated' && prevStatus && message.status === prevStatus) {
      return;
    }

    // Optional type allowlist
    if (toastSettings.types.length > 0 && !toastSettings.types.includes(message.type)) {
      return;
    }

    if (toastSettings.quietHours.enabled) {
      const now = new Date();
      if (isWithinQuietHours(now, toastSettings.quietHours.start, toastSettings.quietHours.end)) {
        return;
      }
    }

    const cooldownMs = Math.max(0, toastSettings.cooldownSeconds) * 1000;
    const dedupeKey = `${eventType}:${message.id}`;
    const nowMs = Date.now();
    const lastAt = this.lastToastAt.get(dedupeKey);
    if (lastAt && cooldownMs > 0 && nowMs - lastAt < cooldownMs) {
      return;
    }
    this.lastToastAt.set(dedupeKey, nowMs);

    const rendered = renderMessage(message);
    const tone = message.status === 'FAILED' ? 'error' : message.status === 'SUCCESS' ? 'success' : 'info';

    useNotificationStore.getState().addNotification({
      type: tone,
      title: rendered.title,
      message: rendered.summary,
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    console.log('[SSE] Scheduling reconnect in 5s...');
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.userId) this.connect(this.userId);
    }, 5000);
  }

  disconnect() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    useMessageStore.getState().setSseConnected(false);
  }
}

export const sseManager = new SSEManager();

function isWithinQuietHours(now: Date, start: string, end: string): boolean {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes == null || endMinutes == null) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // If start <= end: within same day. If start > end: crosses midnight.
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function parseTimeToMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value || '').trim());
  if (!m) return null;
  const hours = Number.parseInt(m[1], 10);
  const minutes = Number.parseInt(m[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}
