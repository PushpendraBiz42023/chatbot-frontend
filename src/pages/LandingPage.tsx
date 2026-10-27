import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export function LandingPage() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo" aria-hidden="true">
          CB
        </div>
        <span className="landing-brand">ChatBot</span>
      </header>

      <main className="landing-main">
        <h1>Talk to your data, instantly.</h1>
        <p>A simple, secure chatbot experience. Sign in to pick up where you left off.</p>

        <div className="landing-actions">
          {isAuthenticated ? (
            <Link to="/app" className="btn btn-primary">
              Go to app
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
