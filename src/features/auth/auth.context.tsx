import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as authApi from "./api/authApi";
import { setAccessToken, setAuthFailureListener } from "../../lib/tokenStore";
import type { AuthState, LoginRequest, SignupRequest, SignupResponseData, User } from "./types/auth.types";

export interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<SignupResponseData>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "loading",
  initialized: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  // Keep a ref mirroring state.accessToken so the http-layer token store always
  // reflects the latest value without re-registering effects.
  const mountedRef = useRef(true);
  // Guards against React StrictMode double-invoking the bootstrap effect in dev,
  // which would otherwise fire two concurrent /auth/refresh calls racing against
  // the single-use rotating refresh cookie (the loser gets a spurious 401).
  const bootstrappedRef = useRef(false);

  const applyAuthenticated = useCallback((user: User, accessToken: string) => {
    setAccessToken(accessToken);
    setState({ user, accessToken, status: "authenticated", initialized: true });
  }, []);

  const applyUnauthenticated = useCallback(() => {
    setAccessToken(null);
    setState({ user: null, accessToken: null, status: "unauthenticated", initialized: true });
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      const { user } = await authApi.me();
      if (mountedRef.current) {
        applyAuthenticated(user, accessToken);
      }
      return true;
    } catch {
      if (mountedRef.current) {
        applyUnauthenticated();
      }
      return false;
    }
  }, [applyAuthenticated, applyUnauthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    // Silent auth bootstrap: try to resume a session from the HttpOnly cookie
    // before rendering any protected route (no flicker).
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      void refreshSession();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    // The http layer calls this when a background 401-refresh-retry both fail,
    // meaning the session is truly gone; reflect that in auth state.
    setAuthFailureListener(() => {
      applyUnauthenticated();
    });
    return () => setAuthFailureListener(null);
  }, [applyUnauthenticated]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const { user, accessToken } = await authApi.login(payload);
      applyAuthenticated(user, accessToken);
    },
    [applyAuthenticated],
  );

  const signup = useCallback(async (payload: SignupRequest) => {
    return authApi.signup(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      applyUnauthenticated();
    }
  }, [applyUnauthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, signup, logout, refreshSession }),
    [state, login, signup, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
