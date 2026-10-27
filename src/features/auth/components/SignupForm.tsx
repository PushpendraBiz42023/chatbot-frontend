import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { signupSchema, type SignupFormValues } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { normalizeApiError } from "../../../lib/http";
import { TextInput } from "../../../components/TextInput";
import { PasswordField } from "./PasswordField";
import { Button } from "../../../components/Button";
import { Alert } from "../../../components/Alert";

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupFormValues) => {
    setFormError(null);
    try {
      const { email } = await signup(values);
      navigate("/verify-otp", { state: { email, purpose: "SIGNUP_VERIFICATION" } });
    } catch (error) {
      const { message } = normalizeApiError(error);
      setFormError(message);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert message={formError} /> : null}
      <TextInput label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" isLoading={isSubmitting} className="btn-block">
        Create account
      </Button>
    </form>
  );
}
