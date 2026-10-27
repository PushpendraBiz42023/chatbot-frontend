interface AlertProps {
  message: string;
  variant?: "error" | "success" | "info";
}

/** Page-level banner for API-level errors/success messages. Announced to screen readers. */
export function Alert({ message, variant = "error" }: AlertProps) {
  return (
    <div className={`alert alert-${variant}`} role="alert">
      {message}
    </div>
  );
}
