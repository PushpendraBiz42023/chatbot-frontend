// Types mirroring the backend auth API contract exactly.
// See: api-contract.md (Login, Refresh, Me, Signup, OTP, Password reset/change).

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: UserRole;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  /** True once the initial refresh + /me resolution (success or failure) has completed. */
  initialized: boolean;
}

export type OtpPurpose = "SIGNUP_VERIFICATION" | "PASSWORD_RESET";

// ---- Request payloads ----

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ResendOtpRequest {
  email: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ---- Response payloads (the `data` field of the success envelope) ----

export interface SignupResponseData {
  email: string;
}

export interface VerifyOtpResponseData {
  verified: true;
  resetToken?: string;
}

export interface LoginResponseData {
  user: User;
  accessToken: string;
}

export interface RefreshResponseData {
  accessToken: string;
}

export interface MeResponseData {
  user: User;
}

// ---- Envelope shapes returned by the backend ----

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  ACCOUNT_NOT_VERIFIED: "ACCOUNT_NOT_VERIFIED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_MAX_ATTEMPTS: "OTP_MAX_ATTEMPTS",
  RESET_TOKEN_INVALID: "RESET_TOKEN_INVALID",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Navigation state carried between the forgot-password -> verify-otp -> reset-password steps. */
export interface ResetFlowState {
  email: string;
  purpose: OtpPurpose;
}

export interface ResetPasswordNavState {
  email: string;
  resetToken: string;
}
