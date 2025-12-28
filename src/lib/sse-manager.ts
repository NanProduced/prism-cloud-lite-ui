import { useMessageStore } from '@/store/messageStore';
import type { MessageListItem, SSEEventEnvelope } from '@/types/message';

class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: number | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.eventSource && this.userId === userId) return;
    
    this.userId = userId;
    this.disconnect();

    const url = '/api/sse/stream';
    console.log('[SSE] Connecting to:', url);

    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
      useMessageStore.getState().setSseConnected(true);
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      useMessageStore.getState().setSseConnected(false);
      this.disconnect();
      this.scheduleReconnect();
    };

    this.eventSource.addEventListener('prism', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as SSEEventEnvelope;
        this.handleEvent(payload);
      } catch (e) {
        console.error('[SSE] Failed to parse message:', e);
      }
    });
  }

  private handleEvent(envelope: SSEEventEnvelope) {
    if (!envelope.success) return;

    console.log(`[SSE] Received event: ${envelope.type}`, envelope.data);

    switch (envelope.type) {
      case 'message.created':
      case 'message.updated':
        if (envelope.data.message) {
          useMessageStore.getState().upsertMessage(envelope.data.message as MessageListItem);
          // Refresh unread count to be accurate
          useMessageStore.getState().fetchInitialData();
        }
        break;
      
      case 'subscription.updated':
        // Notify other stores if needed
        window.dispatchEvent(new CustomEvent('prism.subscription.updated', { detail: envelope.data }));
        break;

      case 'device.status.changed':
      case 'device.updated':
        window.dispatchEvent(new CustomEvent('prism.device.updated', { detail: envelope.scope }));
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

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    console.log('[SSE] Scheduling reconnect in 5s...');
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.userId) this.connect(this.userId);
    }, 5000);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    useMessageStore.getState().setSseConnected(false);
  }
}

export const sseManager = new SSEManager();
