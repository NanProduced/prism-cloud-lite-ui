import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserSettings, updateUserSettings } from '@/services/userApi';
import type { UserSettingsOverrides } from '@/types/user';
import {
  defaultNotificationSettings,
  isNotificationSettingsV2,
  type NotificationSettingsV2,
} from '@/types/notificationSettings';

export type DateFormatPreset =
  | "YYYY-MM-DD"
  | "YYYY/MM/DD"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "MMM D, YYYY";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "en" | "zh";
  timezone: string;
  dateFormat: DateFormatPreset;
  timeFormat: "12h" | "24h";
  showSeconds: boolean;
  defaultCommandTimeout: number; // in minutes
  mapLocationMode: "auto" | "reported" | "manual";
}

interface SettingsState {
  preferences: UserPreferences;
  notificationSettings: NotificationSettingsV2;
  isLoading: boolean;
  isBillingOpen: boolean;
  fetchSettings: () => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  updateNotificationSettings: (next: NotificationSettingsV2) => Promise<void>;
  setBillingOpen: (open: boolean) => void;
}

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const getBrowserLanguage = (): "en" | "zh" => {
  try {
    const lang = navigator.language || (navigator as any).userLanguage;
    if (lang.startsWith("zh")) return "zh";
  } catch {
    // fallback
  }
  return "en";
};

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: getBrowserLanguage(),
  timezone: getBrowserTimezone(),
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  showSeconds: false,
  defaultCommandTimeout: 60,
  mapLocationMode: "auto",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      notificationSettings: defaultNotificationSettings,
      isLoading: false,
      isBillingOpen: false,
      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const res = await getUserSettings();
          if (res.success && res.data) {
            const ui = res.data.ui || {};
            const backendPrefs = ui.preferences || {};
            const backendNotificationSettings = ui.notifications;
            set({
              preferences: {
                ...defaultPreferences,
                ...backendPrefs,
              },
              notificationSettings: isNotificationSettingsV2(backendNotificationSettings)
                ? backendNotificationSettings
                : defaultNotificationSettings,
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },
      updatePreferences: async (patch) => {
        const current = get().preferences;
        const next = { ...current, ...patch };
        
        // Optimistic update
        set({ preferences: next });

        try {
          // Get current full settings to preserve other sections like 'notifications'
          const res = await getUserSettings();
          const currentUi = res.data?.ui || {};
          
          await updateUserSettings({
            ui: {
              ...currentUi,
              preferences: next
            }
          });
        } catch (error) {
          // Revert on error
          set({ preferences: current });
          throw error;
        }
      },
      updateNotificationSettings: async (next) => {
        const current = get().notificationSettings;
        set({ notificationSettings: next });

        try {
          const res = await getUserSettings();
          const currentUi = res.data?.ui || {};

          await updateUserSettings({
            ui: {
              ...currentUi,
              notifications: next,
            },
          } satisfies Partial<UserSettingsOverrides>);
        } catch (error) {
          set({ notificationSettings: current });
          throw error;
        }
      },
      setBillingOpen: (open) => set({ isBillingOpen: open }),
    }),
    {
      name: 'prism-settings-storage',
    }
  )
);
