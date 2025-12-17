import { useState } from 'react';
import { toast } from 'sonner';

import SettingsNotifications, { type NotificationPreferences } from '@/registry/new-york/blocks/settings/settings-notifications';
import SettingsPreferences, { type PreferencesData } from '@/registry/new-york/blocks/settings/settings-preferences';
import SettingsProfile, { type ProfileData } from '@/registry/new-york/blocks/settings/settings-profile';
import SettingsSecurity, { type SecurityEvent, type SecuritySession } from '@/registry/new-york/blocks/settings/settings-security';
import SettingsAPIKeys, { type APIKey } from '@/registry/new-york/blocks/settings/settings-api-keys';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york/ui/tabs';

import { DeviceDefaultsCard, type DeviceDefaults } from './DeviceDefaultsCard';

const STORAGE_KEYS = {
  profile: 'prism.settings.profile',
  preferences: 'prism.settings.preferences',
  notifications: 'prism.settings.notifications',
  deviceDefaults: 'prism.settings.deviceDefaults',
  activeTab: 'prism.settings.activeTab',
};

const TAB_ITEMS = [
  { value: 'profile', label: 'Profile' },
  { value: 'preferences', label: 'Preferences' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'device-defaults', label: 'Device Defaults' },
  { value: 'security', label: 'Security' },
  { value: 'api-keys', label: 'API Keys' },
] as const;

type SettingsTab = (typeof TAB_ITEMS)[number]['value'];

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === 'string' && TAB_ITEMS.some((tab) => tab.value === value);
}

const MOCK_NOW_MS = Date.parse('2025-12-17T12:00:00Z');

const DEFAULT_API_KEYS: APIKey[] = [
  {
    id: 'key-prod',
    name: 'Production API Key',
    key: 'prism_live_1234xxxxxxxxxxxxxxxxxxxx5678',
    createdAt: new Date(MOCK_NOW_MS - 1000 * 60 * 60 * 24 * 12),
    lastUsed: new Date(MOCK_NOW_MS - 1000 * 60 * 35),
    scopes: ['read', 'write'],
    usageCount: 1204,
    rateLimit: {
      limit: 10000,
      remaining: 8421,
      resetAt: new Date(MOCK_NOW_MS + 1000 * 60 * 60 * 12),
    },
  },
];

const DEFAULT_SESSIONS: SecuritySession[] = [
  {
    id: 'session-current',
    device: 'Chrome · Windows',
    location: 'Shanghai, CN',
    ipAddress: '10.0.0.23',
    lastActive: new Date(MOCK_NOW_MS - 1000 * 60 * 2),
    current: true,
  },
  {
    id: 'session-2',
    device: 'Safari · iOS',
    location: 'Hangzhou, CN',
    ipAddress: '10.0.0.88',
    lastActive: new Date(MOCK_NOW_MS - 1000 * 60 * 60 * 14),
    current: false,
  },
];

const DEFAULT_SECURITY_HISTORY: SecurityEvent[] = [
  {
    id: 'evt-1',
    type: 'login',
    description: 'Successful sign-in',
    ipAddress: '10.0.0.23',
    location: 'Shanghai, CN',
    timestamp: new Date(MOCK_NOW_MS - 1000 * 60 * 50),
    status: 'success',
  },
  {
    id: 'evt-2',
    type: 'password_change',
    description: 'Password updated',
    ipAddress: '10.0.0.23',
    location: 'Shanghai, CN',
    timestamp: new Date(MOCK_NOW_MS - 1000 * 60 * 60 * 24 * 8),
    status: 'success',
  },
];

function safeReadJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWriteJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const stored = safeReadJson<unknown>(STORAGE_KEYS.activeTab);
    return isSettingsTab(stored) ? stored : 'profile';
  });

  const [profile, setProfile] = useState<ProfileData>(() => {
    const stored = safeReadJson<Partial<ProfileData>>(STORAGE_KEYS.profile);
    return {
      name: stored?.name ?? 'Prism Admin',
      email: stored?.email ?? 'admin@prismcloud.dev',
      avatarPreset: stored?.avatarPreset ?? 'prism',
    };
  });

  const [preferences, setPreferences] = useState<PreferencesData | undefined>(() => (
    safeReadJson<PreferencesData>(STORAGE_KEYS.preferences) ?? undefined
  ));

  const [notifications, setNotifications] = useState<NotificationPreferences | undefined>(() => (
    safeReadJson<NotificationPreferences>(STORAGE_KEYS.notifications) ?? undefined
  ));

  const [deviceDefaults, setDeviceDefaults] = useState<DeviceDefaults | undefined>(() => (
    safeReadJson<DeviceDefaults>(STORAGE_KEYS.deviceDefaults) ?? undefined
  ));

  const [apiKeys, setApiKeys] = useState<APIKey[]>(() => DEFAULT_API_KEYS);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="rounded-xl border bg-card px-5 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize timezone, notifications, and account security.
          </p>
        </div>
      </header>

      <Tabs
        className="space-y-6"
        onValueChange={(next) => {
          if (!isSettingsTab(next)) return;
          setActiveTab(next);
          safeWriteJson(STORAGE_KEYS.activeTab, next);
        }}
        value={activeTab}
      >
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger className="shrink-0 rounded-lg" key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent className="mt-0" forceMount value="profile">
          <SettingsProfile
            profile={profile}
            onSave={async (next) => {
              setProfile(next);
              safeWriteJson(STORAGE_KEYS.profile, next);
              toast.success('Profile updated');
            }}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="preferences">
          <SettingsPreferences
            preferences={preferences}
            onSave={async (next) => {
              setPreferences(next);
              safeWriteJson(STORAGE_KEYS.preferences, next);
              toast.success('Preferences saved');
            }}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="notifications">
          <SettingsNotifications
            preferences={notifications}
            onSave={async (next) => {
              setNotifications(next);
              safeWriteJson(STORAGE_KEYS.notifications, next);
              toast.success('Notification preferences saved');
            }}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="device-defaults">
          <DeviceDefaultsCard
            onSave={async (next) => {
              setDeviceDefaults(next);
              safeWriteJson(STORAGE_KEYS.deviceDefaults, next);
              toast.success('Device defaults saved');
            }}
            value={deviceDefaults}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="security">
          <SettingsSecurity
            onDisable2FA={async () => {
              toast.success('2FA disabled (mock)');
            }}
            onEnable2FA={async () => {
              toast.success('2FA enabled (mock)');
            }}
            onGenerateBackupCodes={async () => {
              return Array.from({ length: 10 }).map(
                (_, i) => `PRISM-${i}${Math.random().toString(16).slice(2, 6).toUpperCase()}`
              );
            }}
            onPasswordChange={async () => {
              toast.success('Password updated (mock)');
            }}
            onRevokeAllSessions={async () => {
              toast.success('All sessions revoked (mock)');
            }}
            onRevokeSession={async () => {
              toast.success('Session revoked (mock)');
            }}
            securityHistory={DEFAULT_SECURITY_HISTORY}
            sessions={DEFAULT_SESSIONS}
            twoFactorEnabled={false}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="api-keys">
          <SettingsAPIKeys
            apiKeys={apiKeys}
            onCreate={async (data) => {
              const id = `key-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
              const nextKey: APIKey = {
                id,
                name: data.name,
                key: `prism_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`,
                createdAt: new Date(),
                scopes: data.scopes,
                expiresAt: data.expiresAt,
              };
              setApiKeys((prev) => [nextKey, ...prev]);
              toast.success('API key created (mock)');
              return nextKey;
            }}
            onRegenerate={async (keyId) => {
              let updated: APIKey | null = null;
              setApiKeys((prev) =>
                prev.map((k) => {
                  if (k.id !== keyId) return k;
                  updated = {
                    ...k,
                    key: `prism_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`,
                  };
                  return updated;
                })
              );
              toast.success('API key regenerated (mock)');
              return updated ?? apiKeys.find((k) => k.id === keyId)!;
            }}
            onRevoke={async (keyId) => {
              setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
              toast.success('API key revoked (mock)');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
