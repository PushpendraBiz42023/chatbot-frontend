import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { verifyOtpSchema, type VerifyOtpFormValues } from "../schemas/auth.schema";
import * as authApi from "../api/authApi";
import { normalizeApiError } from "../../../lib/http";
import { TextInput } from "../../../components/TextInput";
import { Button } from "../../../components/Button";
import { Alert } from "../../../components/Alert";
import type { OtpPurpose } from "../types/auth.types";

interface VerifyOtpFormProps {
  email: string;
  purpose: OtpPurpose;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyOtpForm({ email, purpose }: VerifyOtpFormProps) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({ resolver: zodResolver(verifyOtpSchema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (values: VerifyOtpFormValues) => {
    setFormError(null);
    try {
      const result = await authApi.verifyOtp({ email, code: values.code, purpose });
      if (purpose === "PASSWORD_RESET") {
        if (!result.resetToken) {
          setFormError("Something went wrong. Please try again.");
          return;
        }
        navigate("/reset-password", { state: { email, resetToken: result.resetToken } });
      } else {
        navigate("/login", { state: { verified: true } });
      }
    } catch (error) {
      const { message } = normalizeApiError(error);
      setFormError(message);
    }
  };

  const onResend = async () => {
    setFormError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await authApi.resendOtp({ email, purpose });
      setResendMessage("A new code has been sent if the account exists.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const { message } = normalizeApiError(error);
      setFormError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert message={formError} /> : null}
      {resendMessage ? <Alert message={resendMessage} variant="success" /> : null}
      <p className="form-hint">We sent a 6-digit code to {email}.</p>
      <TextInput
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={errors.code?.message}
        {...register("code")}
      />
      <Button type="submit" isLoading={isSubmitting} className="btn-block">
        Verify
      </Button>
      <Button
        type="button"
        variant="ghost"
        isLoading={isResending}
        disabled={cooldown > 0}
        onClick={onResend}
        className="btn-block"
      >
        {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
      </Button>
    </form>
  );
}
