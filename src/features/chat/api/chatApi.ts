// Chat streaming uses raw `fetch()` rather than the shared `http` axios instance:
// axios doesn't stream response bodies well, and we need AbortController support
// for "stop generation". We still read the access token from the SAME in-memory
// tokenStore the axios interceptor uses (lib/http.ts), so auth stays consistent,
// and we report a hard auth failure through the SAME listener http.ts uses
// (setAuthFailureListener/notifyAuthFailure) instead of inventing a second
// logout mechanism.
import { getAccessToken, notifyAuthFailure } from "../../../lib/tokenStore";
import { http } from "../../../lib/http";
import type { ApiError, ApiSuccess } from "../../auth/types/auth.types";
import type { ChatProviderStatusEntry, ChatStreamEvent } from "../types/chat.types";

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

/** GET /api/chat/provider-status — cheap, rate-limited check used by the "all exhausted" card. */
export async function getChatProviderStatus(): Promise<ChatProviderStatusEntry[]> {
  const { data } = await http.get<ApiSuccess<{ providers: ChatProviderStatusEntry[] }>>("/chat/provider-status");
  return data.data.providers;
}

export interface StreamChatInput {
  /** Omit/null to start a brand-new conversation; the server assigns the real id via `onMeta`. */
  conversationId?: string | null;
  message: string;
}

export interface StreamChatHandlers {
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (message: string, code?: string) => void;
  /** Fires once, as the first frame of the stream, with the (possibly newly-created) conversation's id. */
  onMeta?: (conversationId: string) => void;
  /**
   * Fires instead of `onError` when the active provider's retry budget is exhausted and no
   * assistant content was generated — a distinct "pick a provider" situation, not a retryable
   * error. Terminal, like `onDone`/`onError`: no further frames follow.
   */
  onProviderUnavailable?: (event: Extract<ChatStreamEvent, { type: "provider_unavailable" }>) => void;
  signal?: AbortSignal;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Streams a chat response. Resolves once the stream ends (via onDone or onError) —
 * callers don't need the returned promise's value, just to know it settled.
 *
 * Deliberately does NOT attempt the axios interceptor's silent-refresh-and-retry
 * dance on a 401: if the initial request itself is unauthenticated, the session
 * is treated as gone and the app's existing auth-failure listener is notified,
 * which is the same signal the axios layer uses to redirect to /login.
 */
export async function streamChat(
  { conversationId, message }: StreamChatInput,
  { onChunk, onDone, onError, onMeta, onProviderUnavailable, signal }: StreamChatHandlers,
): Promise<void> {
  const token = getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${baseURL}/chat`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversationId: conversationId ?? null, message }),
    });
  } catch {
    if (signal?.aborted) return; // user-initiated stop, not an error to surface
    onError("Unable to reach the server. Please check your connection and try again.", "NETWORK_ERROR");
    return;
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifyAuthFailure();
      onError("Your session has expired. Please log in again.", "UNAUTHORIZED");
      return;
    }

    let message2 = GENERIC_ERROR;
    let code = "INTERNAL_ERROR";
    try {
      const data = (await response.json()) as ApiError;
      message2 = data.message ?? message2;
      code = data.code ?? code;
    } catch {
      // Non-JSON error body; fall back to the generic message.
    }
    onError(message2, code);
    return;
  }

  if (!response.body) {
    onError(GENERIC_ERROR, "AI_PROVIDER_ERROR");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawFrame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const line of rawFrame.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice("data:".length).trim();
          if (!jsonStr) continue;

          let event: ChatStreamEvent;
          try {
            event = JSON.parse(jsonStr) as ChatStreamEvent;
          } catch {
            continue; // skip malformed frames rather than crashing the stream
          }

          if (event.type === "meta") {
            onMeta?.(event.conversationId);
          } else if (event.type === "chunk") {
            onChunk(event.content);
          } else if (event.type === "done") {
            onDone();
            return;
          } else if (event.type === "error") {
            onError(event.message, event.code);
            return;
          } else if (event.type === "provider_unavailable") {
            onProviderUnavailable?.(event);
            return;
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
    // Stream closed without an explicit "done"/"error" frame — treat as done.
    onDone();
  } catch {
    if (signal?.aborted) return; // user-initiated stop, not an error to surface
    onError("The connection was interrupted. Please try again.", "AI_PROVIDER_ERROR");
  }
}
