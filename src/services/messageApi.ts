import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { 
  MessageListItem, 
  MessageDetail, 
  MessagePageResponse, 
  UnreadCountResponse 
} from '@/types/message';

/**
 * Get recent messages for the notification bell
 */
export async function getRecentMessages(params?: {
  kind?: 'NOTIFICATION' | 'TASK';
  limit?: number;
}): Promise<BffResponse<MessageListItem[]>> {
  return handleRequest<MessageListItem[]>(
    apiClient.get('/messages/recent', { params })
  );
}

/**
 * Get paged messages for the message center
 */
export async function getMessages(params?: {
  kind?: 'NOTIFICATION' | 'TASK';
  type?: string;
  status?: string;
  read?: 'unread' | 'read' | 'all';
  from?: string;
  to?: string;
  keyword?: string;
  deviceId?: string;
  programId?: string;
  operationId?: string;
  taskId?: string;
  page?: number;
  size?: number;
}): Promise<BffResponse<MessagePageResponse>> {
  return handleRequest<MessagePageResponse>(
    apiClient.get('/messages', { params })
  );
}

/**
 * Get full message details
 */
export async function getMessageDetail(messageId: string): Promise<BffResponse<MessageDetail>> {
  return handleRequest<MessageDetail>(
    apiClient.get(`/messages/${messageId}`)
  );
}

/**
 * Get unread message count
 */
export async function getUnreadCount(): Promise<BffResponse<UnreadCountResponse>> {
  return handleRequest<UnreadCountResponse>(
    apiClient.get('/messages/unread-count')
  );
}

/**
 * Mark specific messages as read
 */
export async function markAsRead(ids: string[]): Promise<BffResponse<{ updated: number }>> {
  return handleRequest<{ updated: number }>(
    apiClient.post('/messages/read', { ids })
  );
}

/**
 * Mark a single message as read
 */
export async function markSingleAsRead(messageId: string): Promise<BffResponse<void>> {
  return handleRequest<void>(
    apiClient.post(`/messages/${messageId}/read`)
  );
}
