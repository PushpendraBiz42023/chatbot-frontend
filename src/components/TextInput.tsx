import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Accessible text input: label is associated via htmlFor/id, errors are
 * exposed via aria-invalid + aria-describedby and announced with role="alert".
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, id, className, ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="field">
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          className={["text-input", className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {hint ? (
          <p id={hintId} className="field-hint">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
