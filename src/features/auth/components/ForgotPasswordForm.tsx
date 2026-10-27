import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas/auth.schema";
import * as authApi from "../api/authApi";
import { normalizeApiError } from "../../../lib/http";
import { TextInput } from "../../../components/TextInput";
import { Button } from "../../../components/Button";
import { Alert } from "../../../components/Alert";

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    try {
      await authApi.forgotPassword(values);
      // Always proceed to the OTP step: the endpoint never reveals whether the email exists.
      navigate("/verify-otp", { state: { email: values.email, purpose: "PASSWORD_RESET" } });
    } catch (error) {
      const { message } = normalizeApiError(error);
      setFormError(message);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert message={formError} /> : null}
      <p className="form-hint">Enter your email and we'll send you a verification code to reset your password.</p>
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" isLoading={isSubmitting} className="btn-block">
        Send code
      </Button>
    </form>
  );
}
