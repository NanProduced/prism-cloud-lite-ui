import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@/store/notificationStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import SettingsNotifications from '@/registry/new-york/blocks/settings/settings-notifications';
import SettingsPreferences, { type PreferencesData } from '@/registry/new-york/blocks/settings/settings-preferences';
import SettingsProfile, { type ProfileData } from '@/registry/new-york/blocks/settings/settings-profile';
import SettingsSecurity from '@/registry/new-york/blocks/settings/settings-security';
import type { SecurityEvent, SecuritySession } from '@/registry/new-york/blocks/settings/settings-security';
import SettingsAPIKeys from '@/registry/new-york/blocks/settings/settings-api-keys';
import type { APIKey } from '@/registry/new-york/blocks/settings/settings-api-keys';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york/ui/tabs';
import BillingPage from '../BillingPage';

import { ProgramDraftPolicyCard } from './ProgramDraftPolicyCard';
import { getProgramDraftSavePolicy, setProgramDraftSavePolicy, type ProgramDraftSavePolicy } from '@/features/programs/storage/draftPolicyDb';
import { useSettingsStore } from '@/store/settingsStore';
import {
  getUserProfile,
  updateUserProfile,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getSecurityHistory,
  changePassword,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  regenerateApiKey,
  bindPhoneRequest,
  bindPhoneConfirm,
} from '@/services/userApi';
import type { UserProfile, UserSession, UserSecurityEvent, UserApiKey } from '@/types/user';
import { getErrorMessage } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import { UAParser } from 'ua-parser-js';

const TAB_ITEMS = [
  { value: 'profile', label: 'Profile' },
  { value: 'preferences', label: 'Preferences' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Security' },
  { value: 'api-keys', label: 'API Keys' },
  { value: 'billing', label: 'Billing' },
] as const;

type SettingsTab = (typeof TAB_ITEMS)[number]['value'];

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === 'string' && TAB_ITEMS.some((tab) => tab.value === value);
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser } = useAuthStore();
  
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    isSettingsTab(initialTab) ? initialTab : 'profile'
  );

  // Sync state with search params if they change externally (e.g. browser back/forward)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isSettingsTab(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const {
    preferences: globalPreferences,
    updatePreferences,
    notificationSettings,
    updateNotificationSettings,
  } = useSettingsStore();

  const [programDraftPolicy, setProgramDraftPolicyState] = useState<ProgramDraftSavePolicy>(() => getProgramDraftSavePolicy());

  // --- Queries ---

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getUserProfile,
  });

  const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['user', 'sessions'],
    queryFn: getActiveSessions,
    enabled: activeTab === 'security',
  });

  const { data: securityHistoryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['user', 'security-history'],
    queryFn: () => getSecurityHistory({ page: 0, size: 20 }),
    enabled: activeTab === 'security',
  });

  const { data: apiKeysData, isLoading: isApiKeysLoading } = useQuery({
    queryKey: ['user', 'api-keys'],
    queryFn: getApiKeys,
    enabled: activeTab === 'api-keys',
  });

  // --- Mutations ---

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      
      // Sync global store
      updateUser({
        displayName: variables.displayName,
        avatarId: variables.avatarId,
      });

      window.dispatchEvent(new Event('prism-profile-updated')); // Notify other components if needed
      toast.success('Profile updated');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password updated');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'sessions'] });
      toast.success('Session revoked');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'sessions'] });
      toast.success('All sessions revoked');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'api-keys'] });
      toast.success('API key created');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'api-keys'] });
      toast.success('API key revoked');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: regenerateApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'api-keys'] });
      toast.success('API key regenerated');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const bindPhoneRequestMutation = useMutation({
    mutationFn: bindPhoneRequest,
    onSuccess: () => {
      toast.info('Verification code sent to your phone');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const bindPhoneConfirmMutation = useMutation({
    mutationFn: bindPhoneConfirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success('Phone number bound successfully');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  // --- Data Mapping ---

  const userProfile: ProfileData = {
    name: profileData?.data?.displayName || 'User',
    email: profileData?.data?.email || '',
    avatarPreset: profileData?.data?.avatarId || 'm-1',
    phone: profileData?.data?.phone,
  };

  // Map backend settings to UI preferences
  const preferences: any = globalPreferences;

  const sessions: SecuritySession[] = (sessionsData?.data || []).map(s => {
    const parser = new UAParser(s.userAgent || '');
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserName = browser.name ? `${browser.name} ${browser.major || ''}` : 'Unknown Browser';
    const osName = os.name ? `${os.name} ${os.version || ''}` : 'Unknown OS';
    
    // Construct a friendly device string
    let deviceDisplay = s.deviceName || osName;
    if (device.model) {
      deviceDisplay = `${device.vendor || ''} ${device.model}`.trim();
    } else if (os.name === 'Windows') {
      deviceDisplay = 'Windows PC';
    } else if (os.name === 'Mac OS') {
      deviceDisplay = 'Mac';
    }

    return {
      id: s.series,
      device: deviceDisplay,
      browser: browserName,
      os: osName,
      location: s.ipAddress === '127.0.0.1' || s.ipAddress === '0:0:0:0:0:0:0:1' ? 'Localhost' : 'Unknown',
      ipAddress: s.ipAddress || '',
      lastActive: new Date(s.lastUsedAt),
      createdAt: new Date(s.createdAt),
      expiresAt: new Date(s.expiresAt),
      current: s.current,
    };
  });

  const normalizeSecurityEventType = (type: string): SecurityEvent['type'] => {
    const t = (type || '').toLowerCase();
    if (t.includes('logout')) return 'logout';
    if (t.includes('password')) return 'password_change';
    if (t.includes('2fa') && t.includes('enable')) return '2fa_enabled';
    if (t.includes('2fa') && t.includes('disable')) return '2fa_disabled';
    return 'login';
  };

  const securityHistory: SecurityEvent[] = (securityHistoryData?.data?.items || []).map((e) => ({
    id: e.id.toString(),
    type: normalizeSecurityEventType(e.type),
    description: e.type, // Keep raw type for now
    ipAddress: e.ipAddress || '',
    location: 'Unknown',
    timestamp: new Date(e.createdAt),
    status: e.success ? 'success' : 'failed',
  }));

  const apiKeysList: APIKey[] = (apiKeysData?.data || []).map(k => ({
    id: k.id,
    name: k.name,
    key: k.clientId + '...', // Don't have full key/secret in list, just clientID
    createdAt: new Date(k.createdAt),
    lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt) : new Date(),
    scopes: ['read', 'write'], // Backend doesn't return scopes in list yet
    usageCount: 0, // Not available
  }));

  if (isProfileLoading && !profileData) {
    return <div className="flex justify-center p-12">Loading settings...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Tabs
        className="space-y-6"
        onValueChange={(next) => {
          if (!isSettingsTab(next)) return;
          setActiveTab(next);
          setSearchParams({ tab: next });
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
            profile={userProfile}
            onSave={async (next) => {
              updateProfileMutation.mutateAsync({
                displayName: next.name,
                avatarId: next.avatarPreset,
              });
            }}
            onBindPhoneRequest={async (phone) => {
              await bindPhoneRequestMutation.mutateAsync({ phone });
            }}
            onBindPhoneConfirm={async (phone, code) => {
              await bindPhoneConfirmMutation.mutateAsync({ phone, code });
            }}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="preferences">
          <div className="space-y-6">
            <SettingsPreferences
              preferences={preferences}
              onSave={async (next) => {
                await updatePreferences(next);
              }}
            />

            <ProgramDraftPolicyCard
              value={programDraftPolicy}
              onChange={(next) => {
                setProgramDraftSavePolicy(next);
                setProgramDraftPolicyState(next);
                toast.success('Draft save rule updated');
              }}
            />
          </div>
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="notifications">
          <SettingsNotifications
            settings={notificationSettings}
            onSave={async (next) => {
              try {
                await updateNotificationSettings(next);
                toast.success('Settings saved');
              } catch (error: any) {
                toast.error(getErrorMessage(error));
                throw error;
              }
            }}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="security">
          <SettingsSecurity
            onDisable2FA={async () => {
              toast.info('2FA configuration not supported yet');
            }}
            onEnable2FA={async () => {
              toast.info('2FA configuration not supported yet');
            }}
            onGenerateBackupCodes={async () => {
              return [];
            }}
            onPasswordChange={async (current, next) => {
              await changePasswordMutation.mutateAsync({
                currentPassword: current,
                newPassword: next
              });
            }}
            onRevokeAllSessions={async () => {
              await revokeAllSessionsMutation.mutateAsync();
            }}
            onRevokeSession={async (sessionId) => {
              await revokeSessionMutation.mutateAsync(sessionId);
            }}
            securityHistory={securityHistory}
            sessions={sessions}
            twoFactorEnabled={false}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="api-keys">
          <SettingsAPIKeys
            apiKeys={apiKeysList}
            onCreate={async (data) => {
              const res = await createApiKeyMutation.mutateAsync({ name: data.name });
              if (res.success && res.data) {
                 return {
                    id: res.data.id,
                    name: res.data.name,
                    key: res.data.clientSecret || '', // Show secret once
                    createdAt: new Date(res.data.createdAt),
                    lastUsed: new Date(),
                    scopes: ['read', 'write'],
                 } as APIKey;
              }
              throw new Error("Failed to create key");
            }}
            onRegenerate={async (keyId) => {
              const res = await regenerateApiKeyMutation.mutateAsync(keyId);
              if (res.success && res.data) {
                 // Find existing to merge
                 const existing = apiKeysList.find(k => k.id === keyId);
                 return {
                    ...existing,
                    id: res.data.id,
                    name: res.data.name,
                    key: res.data.clientSecret || '', // Show new secret
                 } as APIKey;
              }
              throw new Error("Failed to regenerate key");
            }}
            onRevoke={async (keyId) => {
              await revokeApiKeyMutation.mutateAsync(keyId);
            }}
          />
        </TabsContent>

        <TabsContent className="mt-0" forceMount value="billing">
          <BillingPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
