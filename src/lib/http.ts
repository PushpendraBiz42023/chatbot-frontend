import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "../features/auth/types/auth.types";
import { getAccessToken, notifyAuthFailure, setAccessToken } from "./tokenStore";

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

export const http = axios.create({
  baseURL,
  withCredentials: true, // required so the HttpOnly `sid` cookie round-trips
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Attach the in-memory access token to every outgoing request.
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

const REFRESH_URL = "/auth/refresh";

/**
 * Performs the silent refresh directly (not via `http`) to avoid recursively
 * triggering this same response interceptor.
 */
async function silentRefresh(): Promise<string> {
  const response = await axios.post<{ success: true; data: { accessToken: string } }>(
    `${baseURL}${REFRESH_URL}`,
    undefined,
    { withCredentials: true },
  );
  const { accessToken } = response.data.data;
  setAccessToken(accessToken);
  return accessToken;
}

// On a 401 (expired access token), try exactly one silent refresh + retry.
// If the failing request IS the refresh call itself, or the retry also 401s,
// give up and report an unrecoverable auth failure.
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes(REFRESH_URL);

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        const token = await silentRefresh();
        original.headers.set("Authorization", `Bearer ${token}`);
        return http(original);
      } catch {
        setAccessToken(null);
        notifyAuthFailure();
        return Promise.reject(error);
      }
    }

    if (status === 401 && isRefreshCall) {
      setAccessToken(null);
      notifyAuthFailure();
    }

    return Promise.reject(error);
  },
);

export interface NormalizedApiError {
  message: string;
  code: string;
  status: number | undefined;
}

const FALLBACK_ERROR: NormalizedApiError = {
  message: "Something went wrong. Please try again.",
  code: "INTERNAL_ERROR",
  status: undefined,
};

/** Turns any thrown value from an `http` call into a consistent {message, code, status} shape. */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return {
      message: data?.message ?? FALLBACK_ERROR.message,
      code: data?.code ?? FALLBACK_ERROR.code,
      status: error.response?.status,
    };
  }
  return FALLBACK_ERROR;
}
