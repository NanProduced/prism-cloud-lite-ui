import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  publicId: string;
  email: string;
  displayName?: string;
  avatarId?: string;
  phone?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      setAuth: (user) => set({ user, isAuthenticated: true, isInitializing: false }),
      clearAuth: () => set({ user: null, isAuthenticated: false, isInitializing: false }),
      checkAuth: async () => {
        try {
          const { getUserInfo } = await import('@/services/authApi');
          const response = await getUserInfo();
          if (response.success && response.data) {
            set({ user: response.data, isAuthenticated: true, isInitializing: false });
          } else {
            // If failed but not network error, it means not logged in
            set({ user: null, isAuthenticated: false, isInitializing: false });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false, isInitializing: false });
        }
      },
    }),
    {
      name: 'prism-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
