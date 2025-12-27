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
  isLogoutPending: boolean;
  setAuth: (user: User) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  resetLogoutFlag: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      isLogoutPending: false,
      setAuth: (user) => set({ user, isAuthenticated: true, isInitializing: false, isLogoutPending: false }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      clearAuth: () => set({ user: null, isAuthenticated: false, isInitializing: false, isLogoutPending: true }),
      resetLogoutFlag: () => set({ isLogoutPending: false }),
      checkAuth: async () => {
        // If we just logged out, don't try to re-auth immediately
        if (get().isLogoutPending) {
          set({ isInitializing: false });
          return;
        }

        try {
          const { getUserInfo } = await import('@/services/authApi');
          const response = await getUserInfo();
          if (response.success && response.data) {
            set({ user: response.data, isAuthenticated: true, isInitializing: false });
          } else {
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