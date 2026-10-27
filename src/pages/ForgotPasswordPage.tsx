import { Link, useLocation } from "react-router-dom";
import { ForgotPasswordForm } from "../features/auth/components/ForgotPasswordForm";
import { Alert } from "../components/Alert";

interface LocationState {
  tokenExpired?: boolean;
}

export function ForgotPasswordPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot password</h1>
        {state?.tokenExpired ? (
          <Alert message="That reset link expired or was already used. Please request a new code." />
        ) : null}
        <ForgotPasswordForm />
        <p className="auth-links">
          Remembered your password? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
