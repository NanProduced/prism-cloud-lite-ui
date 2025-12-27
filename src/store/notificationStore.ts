import { create } from 'zustand';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message: string, description?: string) => void;
  error: (title: string, message: string, description?: string) => void;
  warning: (title: string, message: string, description?: string) => void;
  info: (title: string, message: string, description?: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (n) => {
    const id = Math.random().toString(36).slice(2, 9);
    const duration = n.duration ?? 5000;
    
    set((state) => ({
      notifications: [...state.notifications, { ...n, id }]
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id)
        }));
      }, duration);
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  success: (title, message, description) => get().addNotification({ type: 'success', title, message, description }),
  error: (title, message, description) => get().addNotification({ type: 'error', title, message, description }),
  warning: (title, message, description) => get().addNotification({ type: 'warning', title, message, description }),
  info: (title, message, description) => get().addNotification({ type: 'info', title, message, description }),
}));

// Helper to access outside of components if needed (though useNotificationStore is preferred)
const get = () => useNotificationStore.getState();

export const toast = {
  success: (message: string, options?: Partial<Notification>) => 
    get().addNotification({ type: 'success', title: 'Success', message, ...options }),
  error: (message: string, options?: Partial<Notification>) => 
    get().addNotification({ type: 'error', title: 'Error', message, ...options }),
  warning: (message: string, options?: Partial<Notification>) => 
    get().addNotification({ type: 'warning', title: 'Warning', message, ...options }),
  info: (message: string, options?: Partial<Notification>) => 
    get().addNotification({ type: 'info', title: 'Info', message, ...options }),
  message: (message: string, options?: Partial<Notification>) => 
    get().addNotification({ type: 'info', title: 'Notification', message, ...options }),
};
