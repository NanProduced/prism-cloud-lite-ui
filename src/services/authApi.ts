import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  BffResponse,
  LoginRequest,
  LoginResponse,
  RequestEmailOtpRequest,
  RegisterRequestOtpRequest,
  RegisterVerifyOtpRequest,
  RegisterVerifyOtpResponse,
  RegisterCompleteRequest,
} from '../types/auth';

// API base URL - defaults to auth service directly in development
// In production, requests should go through the gateway
const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth';

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
const USE_MOCK = true;

const mockResponse = <T>(data?: T): Promise<BffResponse<T>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: data as T,
        requestId: 'mock-req-id-' + Date.now(),
        timestamp: new Date().toISOString(),
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
 * Login API - Submit login
 */
export async function login(request: LoginRequest): Promise<BffResponse<LoginResponse>> {
  if (USE_MOCK) {
    return mockResponse<LoginResponse>({
      redirectUrl: request.continueUrl || '/',
    });
  }

  return handleBffRequest<LoginResponse>(
    authApiClient.post<BffResponse<LoginResponse>>('/login', request)
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
export function getErrorMessage(response: BffResponse): string {
  return response.error?.displayMessage || response.error?.message || 'Unknown error';
}

/**
 * Helper to get error code from BffResponse
 */
export function getErrorCode(response: BffResponse): string | undefined {
  return response.error?.code;
}

/**
 * Helper to check if error is retryable
 */
export function isRetryable(response: BffResponse): boolean {
  return response.error?.retryable || false;
}

