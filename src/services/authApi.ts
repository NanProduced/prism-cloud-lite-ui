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
const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081';

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

/**
 * Login API - Request email OTP
 */
export async function requestEmailOtp(
  request: RequestEmailOtpRequest
): Promise<BffResponse<void>> {
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

