import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

/**
 * Keyboard-accessible copy control (a real <button>, not an <img onClick>) —
 * matches the accessibility bar the auth PasswordField toggle already sets.
 */
export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied; no destructive fallback needed.
    }
  };

  return (
    <button
      type="button"
      className="copy-button"
      aria-label={copied ? "Copied to clipboard" : "Copy message"}
      onClick={() => void handleCopy()}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
