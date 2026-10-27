import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { Spinner } from "../components/Spinner";

interface PublicRouteProps {
  children: ReactNode;
}

/** Redirects already-authenticated users away from auth pages (login/signup/forgot-password/etc). */
export function PublicRoute({ children }: PublicRouteProps) {
  const { status, initialized } = useAuth();

  if (!initialized) {
    return <Spinner label="Loading…" />;
  }

  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
