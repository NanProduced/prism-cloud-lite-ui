import { create } from 'zustand';

interface SystemState {
  isBackendUnreachable: boolean;
  lastCheckTime: number | null;
  setBackendUnreachable: (unreachable: boolean) => void;
  checkHealth: () => Promise<boolean>;
}

export const useSystemStore = create<SystemState>((set) => ({
  isBackendUnreachable: false,
  lastCheckTime: null,
  setBackendUnreachable: (unreachable) => set({ isBackendUnreachable: unreachable }),
  checkHealth: async () => {
    try {
      // Use a simple fetch to the gateway or auth status to check connectivity
      // We use a timestamp to avoid caching
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_ORIGIN || ''}/auth/status?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      
      const isOk = response.ok || response.status === 401; // 401 means backend is there but we are not logged in
      set({ isBackendUnreachable: !isOk, lastCheckTime: Date.now() });
      return isOk;
    } catch (error) {
      set({ isBackendUnreachable: true, lastCheckTime: Date.now() });
      return false;
    }
  },
}));
