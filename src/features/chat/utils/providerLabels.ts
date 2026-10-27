// Small presentation helpers shared between the chat composer's active-provider label and
// ProviderSwitchCard's per-option buttons — kept in one place so both stay consistent.
import type { AiProviderName } from "../types/chat.types";

const PROVIDER_LABELS: Record<AiProviderName, string> = {
  gemini: "Gemini",
  groq: "Groq",
  mistral: "Mistral",
  openrouter: "OpenRouter",
};

export function providerLabel(provider: AiProviderName): string {
  return PROVIDER_LABELS[provider];
}

/**
 * Best-effort friendly rendering of a raw configured model id, e.g. "openai/gpt-oss-20b" ->
 * "Gpt Oss 20b". Falls back to the raw string when it doesn't look like a simple slug (the
 * contract explicitly allows showing the raw model string when a nicer mapping isn't trivial).
 */
function friendlyModel(model: string): string {
  const lastSegment = model.split("/").pop() ?? model;
  if (!/^[a-z0-9.-]+$/i.test(lastSegment)) return model;
  return lastSegment
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** e.g. "Gemini · Flash Lite Latest", or just "Gemini" when no model is known yet. */
export function providerModelLabel(provider: AiProviderName, model: string | null): string {
  const providerPart = providerLabel(provider);
  return model ? `${providerPart} · ${friendlyModel(model)}` : providerPart;
}
