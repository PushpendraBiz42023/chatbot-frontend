import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { normalizeApiError } from "../../../lib/http";
import { TextInput } from "../../../components/TextInput";
import { PasswordField } from "./PasswordField";
import { Button } from "../../../components/Button";
import { Alert } from "../../../components/Alert";

interface LocationState {
  from?: { pathname: string };
}

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values);
      const state = location.state as LocationState | null;
      const destination = state?.from?.pathname ?? "/app";
      navigate(destination, { replace: true });
    } catch (error) {
      const { message, code } = normalizeApiError(error);
      if (code === "ACCOUNT_NOT_VERIFIED") {
        navigate("/verify-otp", { state: { email: values.email, purpose: "SIGNUP_VERIFICATION" } });
        return;
      }
      setFormError(message);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert message={formError} /> : null}
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" isLoading={isSubmitting} className="btn-block">
        Log in
      </Button>
    </form>
  );
}
