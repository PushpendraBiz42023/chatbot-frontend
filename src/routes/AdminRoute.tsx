import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Redirects non-admin users to `/app`. Meant to be nested inside `ProtectedRoute`,
 * which already resolves `initialized`/`status` before rendering its children —
 * so by the time this runs, auth is guaranteed to be settled and `user` is
 * non-null, and no separate loading guard is needed here.
 *
 * This is a UX convenience only, not a security boundary: the real enforcement
 * is the backend's `requireAdmin` middleware on every `/api/admin/*` route.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
