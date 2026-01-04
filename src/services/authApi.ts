import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import apiClient from './apiClient';
import { gatewayOrigin, joinUrl } from '@/config/runtime';
import { sseManager } from '@/lib/sse-manager';
import type {
  BffResponse,
  LoginRequest,
  LoginResponse,
  RequestEmailOtpRequest,
  RequestPhoneOtpRequest,
  RegisterRequestOtpRequest,
  RegisterVerifyOtpRequest,
  RegisterVerifyOtpResponse,
  RegisterCompleteRequest,
  RequestPasswordResetRequest,
  ConfirmPasswordResetRequest,
} from '../types/auth';

// API base URL - defaults to auth service directly in development
// In production, requests should go through the gateway
const API_BASE_URL = joinUrl(gatewayOrigin, '/auth');

const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Response interceptor to handle BffResponse format
authApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BffResponse>) => {
    // Log traceId for debugging
    if (error.response?.data?.traceId) {
      console.error('[Auth API Error]', {
        traceId: error.response.data.traceId,
        code: error.response.data.error?.code,
        message: error.response.data.error?.message,
      });
    }
    return Promise.reject(error);
  }
);

// --- MOCK HELPER ---
const MOCK_DELAY = 800;
const USE_MOCK = false;

const mockResponse = <T>(data?: T): Promise<BffResponse<T>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: data as T,
        error: null,
        traceId: 'mock-trace-id-' + Date.now(),
      });
    }, MOCK_DELAY);
  });
};
// -------------------

/**
 * Login API - Request email OTP
 */
export async function requestEmailOtp(
  request: RequestEmailOtpRequest
): Promise<BffResponse<void>> {
  if (USE_MOCK) return mockResponse<void>();
  
  return handleBffRequest<void>(
    authApiClient.post<BffResponse<void>>(
      '/login/request-email-otp',
      request
    )
  );
}

/**
 * Login API - Request phone (SMS) OTP
 */
export async function requestPhoneOtp(
  request: RequestPhoneOtpRequest
): Promise<BffResponse<void>> {
  if (USE_MOCK) return mockResponse<void>();
  
  return handleBffRequest<void>(
    authApiClient.post<BffResponse<void>>(
      '/login/request-phone-otp',
      request
    )
  );
}

/**
 * Login API - Submit login
 */
export async function login(request: LoginRequest): Promise<BffResponse<LoginResponse>> {
  if (USE_MOCK) {
    return mockResponse<LoginResponse>({
      redirectUrl: request.continueUrl || '/',
    });
  }

  // Ensure we only send defined fields
  const payload = {
    authType: request.authType,
    email: request.email,
    phone: request.phone,
    password: request.password,
    authCode: request.authCode,
    continueUrl: request.continueUrl,
    rememberMe: request.rememberMe,
  };

  console.log('[Auth Service] Login request:', payload);

  return handleBffRequest<LoginResponse>(
    authApiClient.post<BffResponse<LoginResponse>>('/login', payload)
  );
}

/**
 * Login API - Google Login
 */
export async function googleLogin(request: {
  idToken: string;
  continueUrl: string;
  rememberMe?: boolean;
}): Promise<BffResponse<LoginResponse>> {
  if (USE_MOCK) {
    return mockResponse<LoginResponse>({
      redirectUrl: request.continueUrl || '/',
    });
  }

  return handleBffRequest<LoginResponse>(
    authApiClient.post<BffResponse<LoginResponse>>('/login/google', request)
  );
}

/**
 * Register API - Request OTP
 */
export async function registerRequestOtp(
  request: RegisterRequestOtpRequest
): Promise<BffResponse<void>> {
  if (USE_MOCK) return mockResponse<void>();

  return handleBffRequest<void>(
    authApiClient.post<BffResponse<void>>(
      '/register/request-otp',
      request
    )
  );
}

/**
 * Register API - Verify OTP
 */
export async function registerVerifyOtp(
  request: RegisterVerifyOtpRequest
): Promise<BffResponse<RegisterVerifyOtpResponse>> {
  if (USE_MOCK) {
    return mockResponse<RegisterVerifyOtpResponse>({
      verificationToken: 'mock-verification-token-' + Date.now(),
    });
  }

  return handleBffRequest<RegisterVerifyOtpResponse>(
    authApiClient.post<BffResponse<RegisterVerifyOtpResponse>>(
      '/register/verify-otp',
      request
    )
  );
}

/**
 * Register API - Complete registration
 */
export async function registerComplete(
  request: RegisterCompleteRequest
): Promise<BffResponse<void>> {
  if (USE_MOCK) return mockResponse<void>();

  return handleBffRequest<void>(
    authApiClient.post<BffResponse<void>>(
      '/register/complete',
      request
    )
  );
}

/**
 * Password Reset - Request OTP
 */
export async function requestPasswordReset(
  request: RequestPasswordResetRequest
): Promise<BffResponse<void>> {
  return handleBffRequest<void>(
    authApiClient.post<BffResponse<void>>(
      '/login/request-password-reset',
      request
    )
  );
}

/**
 * Password Reset - Confirm
 */
export async function confirmPasswordReset(
  request: ConfirmPasswordResetRequest
): Promise<BffResponse<void>> {
  return handleBffRequest<void>(
    authApiClient.post<BffResponse<void>>(
      '/login/confirm-password-reset',
      request
    )
  );
}

/**
 * Get current authenticated user info from Core Service
 */
export async function getUserInfo(): Promise<BffResponse<{
  publicId: string;
  email: string;
  displayName?: string;
  avatarId?: string;
  phone?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string;
}>> {
  if (USE_MOCK) {
    return mockResponse({
      publicId: 'mock-user-id',
      email: 'mock-user@prism.com',
      displayName: 'Mock User',
    });
  }

  // In dev, use direct 8082 to ensure cookie sharing across ports
  const url = '/user/me';
  return handleBffRequest(apiClient.get(url));
}

async function handleBffRequest<T>(
  requestPromise: Promise<AxiosResponse<BffResponse<T>>>
): Promise<BffResponse<T>> {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<BffResponse<T>>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    throw error;
  }
}

/**
 * Helper to extract error message from BffResponse
 */
export function getErrorMessage(input: unknown): string {
  const fallback = 'Unknown error';

  if (typeof input === 'string') return input;
  if (input == null) return fallback;

  const maybeResp = input as Partial<BffResponse>;
  if (typeof maybeResp === 'object' && 'success' in maybeResp && 'error' in maybeResp) {
    return maybeResp.error?.displayMessage || maybeResp.error?.message || fallback;
  }

  const maybeAxiosError = input as AxiosError<BffResponse>;
  const respData = maybeAxiosError.response?.data;
  if (respData) {
    return respData.error?.displayMessage || respData.error?.message || fallback;
  }

  if (input instanceof Error) return input.message || fallback;

  return fallback;
}

/**
 * Helper to get error code from BffResponse
 */
export function getErrorCode(response: BffResponse): string | undefined {
  return response.error?.code;
}

/**
 * Logout - Invalidate session on backend via SLO (Single Logout)
 */
export function logout(): void {
  // 物理锁：防止并发调用导致重定向冲突（解决 500 页面问题）
  const lockKey = 'prism_logout_in_progress';
  const lockTtlMs = 30_000;
  const lockValue = sessionStorage.getItem(lockKey);
  if (lockValue) {
    const ts = Number.parseInt(lockValue, 10);
    if (Number.isFinite(ts) && Date.now() - ts < lockTtlMs) {
      return;
    }
  }
  
  console.log('[Auth] Global logout initiated. Locking state and redirecting...');
  
  // 设置双重标记
  sessionStorage.setItem(lockKey, String(Date.now()));
  sessionStorage.setItem('prism_just_logged_out', 'true');

  // Close SSE to avoid keeping the session "busy" during redirect
  try {
    sseManager.disconnect();
  } catch {
    // ignore
  }
  
  // 必须使用整页跳转，因为登出包含多次 302 重定向
  window.location.assign(joinUrl(gatewayOrigin, '/logout'));
}
