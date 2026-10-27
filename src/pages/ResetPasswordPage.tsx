import { Navigate, useLocation } from "react-router-dom";
import { ResetPasswordForm } from "../features/auth/components/ResetPasswordForm";

interface LocationState {
  email?: string;
  resetToken?: string;
}

export function ResetPasswordPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  if (!state?.email || !state.resetToken) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset password</h1>
        <ResetPasswordForm email={state.email} resetToken={state.resetToken} />
      </div>
    </div>
  );
}
