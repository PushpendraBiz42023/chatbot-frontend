import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/auth.schema";
import * as authApi from "../api/authApi";
import { normalizeApiError } from "../../../lib/http";
import { PasswordField } from "./PasswordField";
import { Button } from "../../../components/Button";
import { Alert } from "../../../components/Alert";

interface ResetPasswordFormProps {
  email: string;
  resetToken: string;
}

export function ResetPasswordForm({ email, resetToken }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ email, resetToken, ...values });
      navigate("/login", { state: { passwordReset: true } });
    } catch (error) {
      const { message, code } = normalizeApiError(error);
      if (code === "RESET_TOKEN_INVALID") {
        navigate("/forgot-password", { state: { tokenExpired: true } });
        return;
      }
      setFormError(message);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert message={formError} /> : null}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" isLoading={isSubmitting} className="btn-block">
        Reset password
      </Button>
    </form>
  );
}
