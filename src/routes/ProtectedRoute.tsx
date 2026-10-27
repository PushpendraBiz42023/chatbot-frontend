import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { Spinner } from "../components/Spinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

/** Renders children only once authenticated; shows a loading state until the initial auth check resolves. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return <Spinner label="Checking your session…" />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
