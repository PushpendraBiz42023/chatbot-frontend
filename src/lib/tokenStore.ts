// The access token lives ONLY in memory for the lifetime of the tab.
// It is deliberately never written to localStorage/sessionStorage/cookies from JS --
// persistence across reloads happens via the HttpOnly `sid` cookie + a silent
// POST /auth/refresh on boot (see auth.context.tsx), not by storing the token here.

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

type AuthFailureListener = () => void;

let authFailureListener: AuthFailureListener | null = null;

/** Registered by AuthProvider so the http layer can report an unrecoverable 401 (refresh also failed). */
export function setAuthFailureListener(listener: AuthFailureListener | null): void {
  authFailureListener = listener;
}

export function notifyAuthFailure(): void {
  authFailureListener?.();
}
