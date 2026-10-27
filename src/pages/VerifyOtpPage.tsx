import { Navigate, useLocation } from "react-router-dom";
import { VerifyOtpForm } from "../features/auth/components/VerifyOtpForm";
import type { OtpPurpose } from "../features/auth/types/auth.types";

interface LocationState {
  email?: string;
  purpose?: OtpPurpose;
}

export function VerifyOtpPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  // This page only makes sense as a step after /signup or /forgot-password,
  // which hand it {email, purpose} via router state. Direct navigation here
  // (refresh, bookmark, back button after the flow ended) has no email/purpose
  // to verify against, so send the user back to start a flow.
  if (!state?.email || !state.purpose) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify your email</h1>
        <VerifyOtpForm email={state.email} purpose={state.purpose} />
      </div>
    </div>
  );
}
