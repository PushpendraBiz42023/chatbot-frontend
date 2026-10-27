import { http } from "../../../lib/http";
import type {
  ApiSuccess,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  MeResponseData,
  RefreshResponseData,
  ResendOtpRequest,
  ResetPasswordRequest,
  SignupRequest,
  SignupResponseData,
  VerifyOtpRequest,
  VerifyOtpResponseData,
} from "../types/auth.types";

export async function signup(payload: SignupRequest): Promise<SignupResponseData> {
  const { data } = await http.post<ApiSuccess<SignupResponseData>>("/auth/signup", payload);
  return data.data;
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponseData> {
  const { data } = await http.post<ApiSuccess<VerifyOtpResponseData>>("/auth/verify-otp", payload);
  return data.data;
}

export async function resendOtp(payload: ResendOtpRequest): Promise<void> {
  await http.post<ApiSuccess<null>>("/auth/resend-otp", payload);
}

export async function login(payload: LoginRequest): Promise<LoginResponseData> {
  const { data } = await http.post<ApiSuccess<LoginResponseData>>("/auth/login", payload);
  return data.data;
}

export async function refresh(): Promise<RefreshResponseData> {
  const { data } = await http.post<ApiSuccess<RefreshResponseData>>("/auth/refresh");
  return data.data;
}

export async function me(): Promise<MeResponseData> {
  const { data } = await http.get<ApiSuccess<MeResponseData>>("/auth/me");
  return data.data;
}

export async function logout(): Promise<void> {
  await http.post<ApiSuccess<null>>("/auth/logout");
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await http.post<ApiSuccess<null>>("/auth/forgot-password", payload);
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await http.post<ApiSuccess<null>>("/auth/reset-password", payload);
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await http.post<ApiSuccess<null>>("/auth/change-password", payload);
}
