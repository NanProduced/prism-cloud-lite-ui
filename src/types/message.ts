export type MessageKind = 'NOTIFICATION' | 'TASK';

export type MessageStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface MessageListItem {
  id: string;
  kind: MessageKind;
  type: string;
  status?: MessageStatus;
  payload: any;
  deviceId?: string;
  deviceName?: string;
  programId?: string;
  programName?: string;
  operationId?: string;
  taskId?: string;
  createdAt: string;
  readAt: string | null;
}

export interface MessageDetail extends MessageListItem {
  payload?: any;
  updatedAt: string;
}

export interface MessagePageResponse {
  items: MessageListItem[];
  total: number;
  page: number;
  size: number;
}

export interface UnreadCountResponse {
  count: number;
}

/**
 * SSE Event Envelope (FrontendEventMessage)
 */
export interface SSEEventEnvelope<T = any> {
  success: boolean;
  type: string;
  scope: {
    userId: string;
    deviceId?: string;
    operationId?: string;
    [key: string]: any;
  };
  data: T;
  error: any | null;
  traceId: string;
  occurredAt: string;
  version: string;
}

/**
 * Common SSE data structures
 */
export interface DeviceStatusChangedData {
  online: boolean;
}

export interface OperationUpdatedData {
  operationType: string;
  status: string;
  actionType?: string;
  errorMessage?: string;
  [key: string]: any;
}
