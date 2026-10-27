import { useState } from "react";
import { Button } from "../../../components/Button";
import { Alert } from "../../../components/Alert";
import { getChatProviderStatus } from "../api/chatApi";
import { providerLabel } from "../utils/providerLabels";
import type { AiProviderName, ProviderIssueState } from "../types/chat.types";

interface ProviderSwitchCardProps {
  issue: ProviderIssueState;
  isSwitching: boolean;
  onSwitch: (provider: AiProviderName) => Promise<void>;
  /**
   * Dismisses the card without changing the active provider — used by the all-exhausted
   * variant's "Continue on Gemini" and "Retry configured providers" actions, both of which just
   * re-enable the composer per the contract (neither auto-resends anything).
   */
  onDismiss: () => void;
}

const GEMINI_URL = "https://gemini.google.com";

/**
 * Inline card rendered in place of the usual error/regenerate bar when the active provider's
 * retry budget is exhausted (multi-provider-contract.md section 8/9). Never a modal/toast/
 * alert() — matches this app's existing chat-bubble-note/chat-bubble-error inline-message
 * convention exactly.
 *
 * Two variants, chosen purely from `issue.fallbackOptions`: if at least one configured provider
 * after the failed one is currently available, offer explicit "Continue with <Provider>"
 * buttons for each. Otherwise (empty list, or every remaining option unavailable) — every
 * configured provider has now been tried in this failover chain — render the all-exhausted
 * variant. This reads directly off the server-computed availability the contract already sends
 * on every `provider_unavailable` event, so no extra client-side attempt-tracking is needed:
 * switching to a suggested provider that itself immediately fails re-fires this event with a
 * shorter (or empty) `fallbackOptions`, naturally converging to the exhausted state.
 */
export function ProviderSwitchCard({ issue, isSwitching, onSwitch, onDismiss }: ProviderSwitchCardProps) {
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<AiProviderName | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const availableOptions = issue.fallbackOptions.filter((option) => option.available);
  const isExhausted = availableOptions.length === 0;

  const handleSwitch = async (provider: AiProviderName) => {
    setSwitchError(null);
    setPendingProvider(provider);
    try {
      await onSwitch(provider);
    } catch {
      setSwitchError(`Couldn't switch to ${providerLabel(provider)}. Please try again.`);
    } finally {
      setPendingProvider(null);
    }
  };

  const handleContinueOnGemini = () => {
    window.open(GEMINI_URL, "_blank", "noopener,noreferrer");
    onDismiss();
  };

  const handleRetryStatus = async () => {
    setIsCheckingStatus(true);
    setStatusNote(null);
    try {
      const statuses = await getChatProviderStatus();
      const anyAvailable = statuses.some((entry) => entry.configured && entry.status === "available");
      setStatusNote(
        anyAvailable
          ? "Gemini looks available again — try sending your message."
          : "Still unavailable, try again shortly.",
      );
    } catch {
      setStatusNote("Couldn't check provider status. Try again shortly.");
    } finally {
      setIsCheckingStatus(false);
      onDismiss();
    }
  };

  if (isExhausted) {
    return (
      <div className="chat-provider-card" role="status">
        <p className="chat-provider-card-title">All configured AI models are temporarily unavailable.</p>
        <p className="chat-bubble-note">Your conversation is safe. Your chat history has not been lost.</p>
        <div className="chat-provider-card-actions">
          <Button variant="secondary" onClick={handleContinueOnGemini}>
            Continue on Gemini
          </Button>
          <Button variant="ghost" onClick={() => void handleRetryStatus()} isLoading={isCheckingStatus}>
            Retry configured providers
          </Button>
        </div>
        {statusNote ? (
          <p className="chat-bubble-note" role="status">
            {statusNote}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="chat-provider-card" role="status">
      <p className="chat-provider-card-title">{providerLabel(issue.provider)} is temporarily unavailable for this account.</p>
      <p className="chat-bubble-note">Your conversation is safe.</p>
      {switchError ? <Alert message={switchError} /> : null}
      <div className="chat-provider-card-actions">
        {availableOptions.map((option) => (
          <Button
            key={option.provider}
            onClick={() => void handleSwitch(option.provider)}
            isLoading={isSwitching && pendingProvider === option.provider}
            disabled={isSwitching && pendingProvider !== option.provider}
          >
            Continue with {providerLabel(option.provider)}
          </Button>
        ))}
      </div>
    </div>
  );
}
