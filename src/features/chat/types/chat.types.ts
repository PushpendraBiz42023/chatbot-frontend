// Types matching the Day 3 chat persistence contract (POST /api/chat, SSE-style
// streaming over a plain fetch response body). The server now owns conversation/
// message history in MySQL — see chat-persistence-contract.md — so the client no
// longer sends `history`; it only sends `conversationId` (optional) + `message`.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Only meaningful for assistant messages; user messages are always implicitly "done". */
  status?: "streaming" | "error" | "done" | "stopped";
}

export interface ChatRequestPayload {
  /** Omit/null to start a brand-new conversation; the server issues the real id via the `meta` event. */
  conversationId?: string | null;
  message: string;
}

// ---- SSE-style event payloads (each is one `data: <json>\n\n` frame) ----

/** Always the first event of a stream — carries the (possibly newly-created) conversation's id. */
export interface ChatMetaEvent {
  type: "meta";
  conversationId: string;
}

export interface ChatChunkEvent {
  type: "chunk";
  content: string;
}

export interface ChatDoneEvent {
  type: "done";
}

export interface ChatErrorEvent {
  type: "error";
  code: string;
  message: string;
}

// ---- Multi-provider failover (multi-provider-contract.md section 8/9) ----

/** Fixed priority order; only providers with a configured API key are ever usable. */
export type AiProviderName = "gemini" | "groq" | "mistral" | "openrouter";

export interface ProviderFallbackOption {
  provider: AiProviderName;
  available: boolean;
}

/**
 * Emitted instead of the generic `error` event when the active provider's retry budget is
 * exhausted (or it fails non-retryably) and no automatic fallback happened — the user must
 * explicitly pick where to continue via `ProviderSwitchCard`. No assistant message is
 * persisted for this turn; the user's message stays saved.
 */
export interface ChatProviderUnavailableEvent {
  type: "provider_unavailable";
  code: "PROVIDER_UNAVAILABLE";
  provider: AiProviderName;
  model: string;
  fallbackOptions: ProviderFallbackOption[];
}

export type ChatStreamEvent =
  | ChatMetaEvent
  | ChatChunkEvent
  | ChatDoneEvent
  | ChatErrorEvent
  | ChatProviderUnavailableEvent;

/** In-hook state for an unresolved provider-unavailable situation (see `useChat`). */
export type ProviderIssueState = Omit<ChatProviderUnavailableEvent, "type" | "code">;

export type ProviderRuntimeStatus =
  | "available"
  | "temporarily_rate_limited"
  | "quota_exhausted"
  | "unavailable"
  | "configuration_error"
  | "authentication_error"
  | "network_error"
  | "unknown_error";

/** GET /api/chat/provider-status response entry — the user-facing (non-admin) shape. */
export interface ChatProviderStatusEntry {
  provider: AiProviderName;
  configured: boolean;
  status: ProviderRuntimeStatus;
}

// ---- Conversation persistence (features/chat/api/conversationsApi.ts) ----

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  activeProvider: AiProviderName;
  activeModel: string | null;
}

export type MessageRole = "user" | "assistant" | "system";

/** A single persisted turn, as returned by GET /api/conversations/:id/messages. */
export interface MessageRecord {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}
