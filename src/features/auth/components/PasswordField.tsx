import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

/**
 * Password input with a keyboard-accessible show/hide toggle.
 * The toggle is a real <button type="button"> (not an <img onClick>), so it
 * is reachable and operable via keyboard and announced correctly by screen readers.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, id, className, ...inputProps }, ref) => {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="field">
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
        <div className="password-field-wrap">
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={["text-input", className].filter(Boolean).join(" ")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((prev) => !prev)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        {error ? (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
