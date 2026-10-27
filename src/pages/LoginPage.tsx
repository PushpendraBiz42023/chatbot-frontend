import { Link, useLocation } from "react-router-dom";
import { LoginForm } from "../features/auth/components/LoginForm";
import { Alert } from "../components/Alert";

interface LocationState {
  verified?: boolean;
  passwordReset?: boolean;
}

export function LoginPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>
        {state?.verified ? <Alert message="Your email is verified. You can now log in." variant="success" /> : null}
        {state?.passwordReset ? (
          <Alert message="Your password has been reset. Please log in." variant="success" />
        ) : null}
        <LoginForm />
        <p className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p className="auth-links">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
