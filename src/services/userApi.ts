import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type {
  UserProfile,
  UserSettingsOverrides,
  UserSession,
  UserSecurityEvent,
  UserApiKey,
  CreateApiKeyRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  SubscriptionSnapshot,
  RedeemRequest,
  SubscriptionHistoryItem,
  BindPhoneRequest,
  BindPhoneConfirmRequest,
  UserStorageQuotaView,
  UserQuotaOverviewView,
  UserStorageLedgerView,
} from '@/types/user';

// User Profile
export const getUserProfile = () =>
  handleRequest(apiClient.get<BffResponse<UserProfile>>('/user/me'));

export const updateUserProfile = (data: UpdateProfileRequest) =>
  handleRequest(apiClient.post<BffResponse<UserProfile>>('/user/me', data));

// Quota
export const getUserStorageQuota = () =>
  handleRequest(apiClient.get<BffResponse<UserStorageQuotaView>>('/user/quota/storage'));

export const getUserQuotaOverview = () =>
  handleRequest(apiClient.get<BffResponse<UserQuotaOverviewView>>('/user/quota/overview'));

export const getUserStorageLedger = () =>
  handleRequest(apiClient.get<BffResponse<UserStorageLedgerView>>('/user/quota/storage/ledger'));

// Security - Phone Binding
export const bindPhoneRequest = (data: BindPhoneRequest) =>
  handleRequest(apiClient.post<BffResponse<void>>('/user/security/phone/bind/request', data));

export const bindPhoneConfirm = (data: BindPhoneConfirmRequest) =>
  handleRequest(apiClient.post<BffResponse<void>>('/user/security/phone/bind/confirm', data));

// Subscription
export const getUserSubscription = () =>
  handleRequest(apiClient.get<BffResponse<SubscriptionSnapshot>>('/user/subscription'));

export const redeemSubscriptionCode = (data: RedeemRequest) =>
  handleRequest(apiClient.post<BffResponse<SubscriptionSnapshot>>('/user/subscription/redeem', data));

export const getSubscriptionHistory = (params?: { page?: number; size?: number }) =>
  handleRequest(apiClient.get<BffResponse<{ items: SubscriptionHistoryItem[]; total: number }>>('/user/subscription/history', { params }));

// User Settings
export const getUserSettings = () =>
  handleRequest(apiClient.get<BffResponse<UserSettingsOverrides>>('/user/settings'));

export const updateUserSettings = (data: Partial<UserSettingsOverrides>) =>
  handleRequest(apiClient.post<BffResponse<UserSettingsOverrides>>('/user/settings', data));

// Security - Sessions
export const getActiveSessions = () =>
  handleRequest(apiClient.get<BffResponse<UserSession[]>>('/user/security/sessions'));

export const revokeSession = (series: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/user/security/sessions/${series}/revoke`));

export const revokeAllSessions = () =>
  handleRequest(apiClient.post<BffResponse<void>>('/user/security/sessions/revoke-all'));

// Security - History
export const getSecurityHistory = (params?: { page?: number; size?: number }) =>
  handleRequest(apiClient.get<BffResponse<{ items: UserSecurityEvent[]; total: number }>>('/user/security/history', { params }));

// Security - Password
export const changePassword = (data: ChangePasswordRequest) =>
  handleRequest(apiClient.post<BffResponse<void>>('/user/security/password/change', data));

// API Keys
export const getApiKeys = () =>
  handleRequest(apiClient.get<BffResponse<UserApiKey[]>>('/user/api-keys'));

export const createApiKey = (data: CreateApiKeyRequest) =>
  handleRequest(apiClient.post<BffResponse<UserApiKey>>('/user/api-keys', data));

export const revokeApiKey = (id: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/user/api-keys/${id}/revoke`));

export const regenerateApiKey = (id: string) =>
  handleRequest(apiClient.post<BffResponse<UserApiKey>>(`/user/api-keys/${id}/regenerate`));
