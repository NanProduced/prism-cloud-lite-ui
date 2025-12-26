// Backend response wrapper
export interface BffResponse<T = any> {
  success: boolean;
  data: T | null;
  error: BffError | null;
  traceId: string;
}

export interface BffError {
  code: string;
  message: string;
  displayMessage: string;
  retryable: boolean;
}

// Auth types
export type AuthType = 'EMAIL_PWD' | 'EMAIL_OTP' | 'PHONE_PWD' | 'PHONE_OTP';

// Login request
export interface LoginRequest {
  authType: AuthType;
  email?: string;
  phone?: string;
  password?: string;
  authCode?: string;
  continueUrl: string;
  rememberMe?: boolean;
}

// Login response
export interface LoginResponse {
  redirectUrl: string;
}

// Request email OTP
export interface RequestEmailOtpRequest {
  email: string;
}

// Register request OTP
export interface RegisterRequestOtpRequest {
  email: string;
}

// Register verify OTP
export interface RegisterVerifyOtpRequest {
  email: string;
  otp: string;
}

// Register verify OTP response
export interface RegisterVerifyOtpResponse {
  verificationToken: string;
}

// Register complete
export interface RegisterCompleteRequest {
  email: string;
  password: string;
  verificationToken: string;
}

// Password reset
export interface RequestPasswordResetRequest {
  email?: string;
  phone?: string;
}

export interface ConfirmPasswordResetRequest {
  email?: string;
  phone?: string;
  authCode: string;
  newPassword: string;
}

// Error codes
export const AuthErrorCode = {
  EMAIL_EXISTS: 'AUTH-1001',
  INVALID_OTP: 'AUTH-1003',
  OTP_EXPIRED: 'AUTH-1004',
  TOO_MANY_REQUESTS: 'AUTH-1005',
  PASSWORD_REQUIREMENTS: 'AUTH-1006',
  INVALID_CONTINUE_URL: 'AUTH-1014',
  ACCOUNT_OR_CREDENTIAL_ERROR: 'AUTH-1016',
} as const;
