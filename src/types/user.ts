export type SubscriptionTier = 'FREE' | 'PRO' | 'ULTRA';

export interface SubscriptionSnapshot {
  tier: SubscriptionTier;
  startAt?: string;
  endAt?: string;
  proActive: boolean;
}

export interface RedeemRequest {
  code: string;
}

export interface SubscriptionHistoryItem {
  id: string;
  type: string;
  success: boolean;
  code?: string;
  metadata?: string;
  createdAt: string;
}

export interface UserProfile {
  publicId: string;
  email: string;
  displayName?: string;
  avatarId?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionExpiresAt?: string;
  phone?: string;
}

export interface UserSettingsOverrides {
  settings?: Record<string, any>;
  ui?: Record<string, any>;
}

export interface UserSession {
  series: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface UserSecurityEvent {
  id: number;
  type: string;
  success: boolean;
  ipAddress?: string;
  deviceName?: string;
  userAgent?: string;
  metadata?: string;
  createdAt: string;
}

export interface UserApiKey {
  id: string;
  name: string;
  clientId: string;
  clientSecret?: string; // Only returned on creation/regeneration
  createdAt: string;
  lastUsedAt?: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarId?: string;
}

export interface BindPhoneRequest {
  phone: string;
}

export interface BindPhoneConfirmRequest {

  phone: string;

  code: string;

}



export interface UserStorageQuotaView {
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number | null;
  percent: number | null;
}

export interface UserQuotaMetric {
  resource: string;
  used: number;
  limit: number;
  percent: number | null;
}

export interface UserQuotaOverviewView {
  metrics: UserQuotaMetric[];
  programVersionsPerProgram: number;
}

export interface StorageLedgerSource {
  sourceType: string;
  totalBytes: number;
  totalCount: number;
  items: Array<{
    fileType: string;
    totalBytes: number;
    totalCount: number;
  }>;
}

export interface UserStorageLedgerView {
  quotaBytes: number;
  ledgerTotalBytes: number;
  mismatchBytes: number;
  sources: StorageLedgerSource[];
}
