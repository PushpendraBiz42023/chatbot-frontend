import { useCallback, useEffect, useRef, useState } from "react";
import { getConversation, getConversationMessages, updateConversationProvider } from "../api/conversationsApi";
import { streamChat } from "../api/chatApi";
import type { AiProviderName, ChatMessage, MessageRecord, ProviderIssueState } from "../types/chat.types";

function createId(): string {
  return crypto.randomUUID();
}

function fromRecord(record: MessageRecord): ChatMessage | null {
  // "system" turns aren't user-facing history; the UI only ever renders user/assistant bubbles.
  if (record.role !== "user" && record.role !== "assistant") return null;
  return { id: record.id, role: record.role, content: record.content, status: "done" };
}

export interface UseChatOptions {
  /** The `:conversationId` route param, if the page was opened at (or navigated to) an existing chat. */
  conversationId?: string;
  /**
   * Called the first time a brand-new chat learns its server-issued conversation id (via the
   * `meta` SSE event). Routing is an AppPage concern, not this hook's — the page is expected to
   * respond by updating the URL (e.g. `navigate(`/app/chat/${id}`, { replace: true })`).
   */
  onConversationCreated?: (conversationId: string) => void;
  /**
   * Called whenever the server has just persisted something that could change how this
   * conversation looks in the sidebar (a title set on its first exchange, or its `updatedAt`
   * bumped) — i.e. after a stream reaches "done" or is stopped with partial content saved.
   * Not called on a provider error, since nothing new is persisted in that case.
   */
  onConversationUpdated?: () => void;
}

export interface UseChatResult {
  conversationId: string | undefined;
  messages: ChatMessage[];
  isStreaming: boolean;
  /** True while an existing conversation's history is being fetched on mount/navigation. */
  isLoadingHistory: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  regenerate: () => void;
  stop: () => void;
  newChat: () => void;
  /** The conversation's currently active AI provider — defaults to "gemini" for a brand-new chat. */
  activeProvider: AiProviderName;
  /** The active provider's configured model, once known (set on first exchange / loaded with history). */
  activeModel: string | null;
  /**
   * Set when the active provider's retry budget is exhausted mid-turn (multi-provider-contract.md
   * section 8/9) — a distinct "pick a provider" situation, not a retryable `error`. Renders
   * `ProviderSwitchCard` in place of the usual error/regenerate bar.
   */
  providerIssue: ProviderIssueState | null;
  /** True while `switchProvider` is awaiting the PATCH response. */
  isSwitchingProvider: boolean;
  /** Explicit provider switch (PATCH /api/conversations/:id/provider) — clears `providerIssue` on success. */
  switchProvider: (provider: AiProviderName) => Promise<void>;
  /**
   * Dismisses `providerIssue` without changing `activeProvider` — used by the all-exhausted
   * card's "Continue on Gemini" (pure frontend) and "Retry configured providers" actions, both
   * of which just re-enable the composer per the contract.
   */
  dismissProviderIssue: () => void;
}

/**
 * Owns the current chat's message state. Day 3: the server owns conversation/message
 * persistence, so this hook no longer sends `history` on each call — it either hydrates
 * an existing conversation's messages from the server (when opened with a `conversationId`)
 * or starts empty and adopts the server-issued id once the first `meta` SSE event arrives.
 */
export function useChat({
  conversationId: initialConversationId,
  onConversationCreated,
  onConversationUpdated,
}: UseChatOptions = {}): UseChatResult {
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<AiProviderName>("gemini");
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [providerIssue, setProviderIssue] = useState<ProviderIssueState | null>(null);
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const activeModelRef = useRef(activeModel);
  activeModelRef.current = activeModel;

  // Reacts to the route param changing "from the outside" (sidebar navigation, browser back/
  // forward, a fresh load of /app/chat/:id) by hydrating that conversation's history. Skips the
  // case where the prop merely reflects an id THIS hook just adopted via onMeta (conversationIdRef
  // already matches AND messages are already populated from the in-progress stream), so an
  // in-progress stream is never interrupted by its own URL update.
  //
  // Deliberately does NOT use a ref to "remember" it already handled this id across renders —
  // React 18 StrictMode double-invokes this effect once on mount (dev only), and a persisted
  // "already handled" ref would let the second (kept) invocation skip real work while the first
  // (torn-down) invocation's fetch gets cancelled, leaving isLoadingHistory stuck true forever.
  // Each invocation gets its own independent `cancelled` closure instead, exactly like the
  // standard React data-fetching pattern — the discarded invocation's result is dropped, the
  // surviving one's is kept.
  useEffect(() => {
    // Self-adoption case FIRST, before touching the in-flight stream: when a brand-new chat's
    // `meta` event arrives, this hook adopts the server-issued id and AppPage updates the URL,
    // which feeds the same id straight back in as a "new" prop. That is not a navigation — the
    // stream for it is still running. Aborting here would kill the very response being streamed.
    // The `messages` check is what separates the two cases: on a genuine first mount at
    // /app/chat/:id the hook's state was merely *initialised* from this same prop but has no
    // messages yet (so we must fetch), whereas a self-adopted id always already has the
    // in-flight exchange in memory.
    if (
      initialConversationId &&
      initialConversationId === conversationIdRef.current &&
      messagesRef.current.length > 0
    ) {
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setError(null);
    setConversationId(initialConversationId);

    if (!initialConversationId) {
      setMessages([]);
      setIsLoadingHistory(false);
      return;
    }

    let cancelled = false;
    setMessages([]);
    setIsLoadingHistory(true);
    void getConversationMessages(initialConversationId)
      .then((records) => {
        if (cancelled) return;
        setMessages(records.map(fromRecord).filter((message): message is ChatMessage => message !== null));
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load this conversation. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  // Separate effect (deliberately not folded into the history-loading effect above, which has
  // already been carefully debugged for its StrictMode/self-adoption behavior): loads the
  // conversation's `activeProvider`/`activeModel` metadata, and resets the provider-issue/switch
  // transient state on every navigation, same lifecycle as `error` above. A brand-new chat (no
  // id yet) simply defaults to Gemini until its first exchange sets a real activeModel.
  useEffect(() => {
    setProviderIssue(null);

    if (!initialConversationId) {
      setActiveProvider("gemini");
      setActiveModel(null);
      return;
    }

    let cancelled = false;
    void getConversation(initialConversationId)
      .then((conversation) => {
        if (cancelled) return;
        setActiveProvider(conversation.activeProvider ?? "gemini");
        setActiveModel(conversation.activeModel ?? null);
      })
      .catch(() => {
        // Non-fatal: the active-provider label just stays at its previous/default value; the
        // history-loading effect above already surfaces a real error if the conversation itself
        // can't be loaded at all.
      });

    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  const runStream = useCallback(
    (userText: string, assistantId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setError(null);
      setProviderIssue(null);

      void streamChat(
        {
          conversationId: conversationIdRef.current ?? null,
          message: userText,
        },
        {
          signal: controller.signal,
          onMeta: (id) => {
            if (conversationIdRef.current !== id) {
              conversationIdRef.current = id;
              setConversationId(id);
              onConversationCreated?.(id);
            }
          },
          onChunk: (content) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + content, status: "streaming" }
                  : message,
              ),
            );
          },
          onDone: () => {
            setMessages((prev) =>
              prev.map((message) => (message.id === assistantId ? { ...message, status: "done" } : message)),
            );
            setIsStreaming(false);
            abortRef.current = null;
            // The backend persists the assistant message + title/updatedAt in a `finally` block
            // that runs just AFTER it flushes this "done" frame, so the write may not have landed
            // yet at the instant we receive it. Refresh once now (usually enough) and once more
            // shortly after, so the sidebar reliably picks up the real title without a manual reload.
            onConversationUpdated?.();
            setTimeout(() => onConversationUpdated?.(), 400);
            // The very first exchange is the only time `activeModel` transitions from null to a
            // real value (the server sets it once it knows which model actually handled the
            // turn) — pick that up now rather than polling on every turn.
            if (activeModelRef.current === null && conversationIdRef.current) {
              void getConversation(conversationIdRef.current)
                .then((conversation) => {
                  setActiveProvider(conversation.activeProvider ?? "gemini");
                  setActiveModel(conversation.activeModel ?? null);
                })
                .catch(() => {
                  // Non-fatal: the label just stays blank until the next successful load.
                });
            }
          },
          onError: (message) => {
            setMessages((prev) =>
              prev.map((entry) => (entry.id === assistantId ? { ...entry, status: "error" } : entry)),
            );
            setError(message);
            setIsStreaming(false);
            abortRef.current = null;
          },
          onProviderUnavailable: (event) => {
            // No assistant content was generated for this turn (the failure happens before any
            // chunk can stream) — drop the empty placeholder bubble rather than rendering it as
            // an error; ProviderSwitchCard (driven by `providerIssue`) takes over the messaging.
            setMessages((prev) =>
              prev.filter((entry) => !(entry.id === assistantId && entry.content.length === 0)),
            );
            setProviderIssue({ provider: event.provider, model: event.model, fallbackOptions: event.fallbackOptions });
            setIsStreaming(false);
            abortRef.current = null;
          },
        },
      );
    },
    [onConversationCreated, onConversationUpdated],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = { id: createId(), role: "user", content: trimmed, status: "done" };
      const assistantMessage: ChatMessage = { id: createId(), role: "assistant", content: "", status: "streaming" };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      runStream(trimmed, assistantMessage.id);
    },
    [isStreaming, runStream],
  );

  const regenerate = useCallback(() => {
    if (isStreaming) return;

    const current = messagesRef.current;
    const reverseIndex = [...current].reverse().findIndex((message) => message.role === "user");
    if (reverseIndex === -1) return;

    const lastUserIndex = current.length - 1 - reverseIndex;
    const lastUserMessage = current[lastUserIndex];
    const assistantMessage: ChatMessage = { id: createId(), role: "assistant", content: "", status: "streaming" };

    setMessages([...current.slice(0, lastUserIndex + 1), assistantMessage]);
    runStream(lastUserMessage.content, assistantMessage.id);
  }, [isStreaming, runStream]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    let hadPartialContent = false;
    setMessages((prev) =>
      prev.map((message) => {
        if (message.status !== "streaming") return message;
        if (message.content.length > 0) hadPartialContent = true;
        return { ...message, status: "stopped" };
      }),
    );
    // The backend persists any partial assistant content (and may set the title on it) once it
    // observes the disconnect — same landing delay as onDone, see the comment there.
    if (hadPartialContent) {
      onConversationUpdated?.();
      setTimeout(() => onConversationUpdated?.(), 400);
    }
  }, [onConversationUpdated]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setError(null);
    setProviderIssue(null);
    setMessages([]);
    setConversationId(undefined);
    conversationIdRef.current = undefined;
    setActiveProvider("gemini");
    setActiveModel(null);
  }, []);

  const switchProvider = useCallback(async (provider: AiProviderName) => {
    const id = conversationIdRef.current;
    if (!id) return;
    setIsSwitchingProvider(true);
    try {
      const conversation = await updateConversationProvider(id, provider);
      setActiveProvider(conversation.activeProvider ?? provider);
      setActiveModel(conversation.activeModel ?? null);
      setProviderIssue(null);
    } finally {
      setIsSwitchingProvider(false);
    }
  }, []);

  const dismissProviderIssue = useCallback(() => {
    setProviderIssue(null);
  }, []);

  return {
    conversationId,
    messages,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    regenerate,
    stop,
    newChat,
    activeProvider,
    activeModel,
    providerIssue,
    isSwitchingProvider,
    switchProvider,
    dismissProviderIssue,
  };
}
