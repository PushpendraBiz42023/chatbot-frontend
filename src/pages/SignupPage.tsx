import { Link } from "react-router-dom";
import { SignupForm } from "../features/auth/components/SignupForm";

export function SignupPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <SignupForm />
        <p className="auth-links">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
