import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { changePassword } from "../features/auth/api/authApi";
import { changePasswordSchema, type ChangePasswordFormValues } from "../features/auth/schemas/auth.schema";
import { normalizeApiError } from "../lib/http";
import { getStoredTheme, setTheme, type ThemePreference } from "../lib/theme";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { PasswordField } from "../features/auth/components/PasswordField";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * General (non-admin-gated) settings page: Profile, Appearance, Account
 * (admin-dashboard-contract.md section 5). Any authenticated user reaches this —
 * it's wrapped only in ProtectedRoute in App.tsx, not AdminRoute.
 */
export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const handleThemeChange = (value: ThemePreference) => {
    setThemeState(value);
    setTheme(value);
  };

  const onChangePassword = async (values: ChangePasswordFormValues) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await changePassword(values);
      setPasswordSuccess(true);
      reset();
    } catch (error) {
      setPasswordError(normalizeApiError(error).message);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="admin-page settings-page">
      <header className="admin-page-header">
        <h1>Settings</h1>
        <Link to="/app">← Back to Chat</Link>
      </header>

      <section className="admin-card" aria-labelledby="settings-profile-heading">
        <h2 className="admin-card-title" id="settings-profile-heading">
          Profile
        </h2>
        <dl className="admin-detail-list">
          <div>
            <dt>Name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-card" aria-labelledby="settings-appearance-heading">
        <h2 className="admin-card-title" id="settings-appearance-heading">
          Appearance
        </h2>
        <div className="theme-option-group" role="radiogroup" aria-labelledby="settings-appearance-heading">
          {THEME_OPTIONS.map((option) => (
            <label key={option.value} className="theme-option">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={theme === option.value}
                onChange={() => handleThemeChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="admin-card" aria-labelledby="settings-account-heading">
        <h2 className="admin-card-title" id="settings-account-heading">
          Account
        </h2>

        <form className="admin-form" onSubmit={handleSubmit(onChangePassword)} noValidate>
          {passwordError ? <Alert message={passwordError} /> : null}
          {passwordSuccess ? <Alert variant="success" message="Password changed successfully." /> : null}

          <PasswordField
            label="Current password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword")}
          />
          <div className="admin-form-actions">
            <Button type="submit" isLoading={isSubmitting}>
              Change password
            </Button>
          </div>
        </form>

        <div className="settings-logout-row">
          <Button variant="secondary" isLoading={isLoggingOut} onClick={() => void handleLogout()}>
            Log out
          </Button>
        </div>
      </section>
    </div>
  );
}
