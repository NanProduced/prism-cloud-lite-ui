import { create } from 'zustand';
import type { MessageListItem } from '@/types/message';
import { getRecentMessages, getUnreadCount } from '@/services/messageApi';

interface MessageState {
  unreadCount: number;
  recentMessages: MessageListItem[];
  isLoading: boolean;
  sseConnected: boolean;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  updateUnreadCount: (count: number) => void;
  upsertMessage: (message: MessageListItem) => void;
  setSseConnected: (connected: boolean) => void;
  markLocalAsRead: (messageId: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  unreadCount: 0,
  recentMessages: [],
  isLoading: false,
  sseConnected: false,

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [recentRes, unreadRes] = await Promise.all([
        getRecentMessages({ limit: 10 }),
        getUnreadCount()
      ]);

      if (recentRes.success && recentRes.data) {
        set({ recentMessages: recentRes.data });
      }
      if (unreadRes.success && unreadRes.data) {
        set({ unreadCount: unreadRes.data.count });
      }
    } catch (error) {
      console.error('[MessageStore] Failed to fetch initial data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUnreadCount: (count) => set({ unreadCount: count }),

  upsertMessage: (message) => {
    set((state) => {
      const exists = state.recentMessages.find((m) => m.id === message.id);
      let nextMessages = [...state.recentMessages];

      if (exists) {
        nextMessages = nextMessages.map((m) => (m.id === message.id ? message : m));
      } else {
        nextMessages = [message, ...nextMessages];
      }

      // Sort by creation date and limit to 20
      nextMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { recentMessages: nextMessages.slice(0, 20) };
    });
  },

  setSseConnected: (connected) => set({ sseConnected: connected }),

  markLocalAsRead: (messageId) => {
    set((state) => ({
      recentMessages: state.recentMessages.map((m) => 
        m.id === messageId ? { ...m, readAt: new Date().toISOString() } : m
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  }
}));
