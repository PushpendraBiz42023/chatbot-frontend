import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "../../../components/Alert";
import { Spinner } from "../../../components/Spinner";
import { ChatMessageList } from "../../chat/components/ChatMessageList";
import { normalizeApiError } from "../../../lib/http";
import { getAdminUserConversationMessages } from "../api/adminUsersApi";
import type { AdminConversationMessage } from "../types/admin.types";
import type { ChatMessage } from "../../chat/types/chat.types";

/** Same mapping useChat.ts uses for its own history load: system turns aren't user-facing. */
function toChatMessage(record: AdminConversationMessage): ChatMessage | null {
  if (record.role !== "user" && record.role !== "assistant") return null;
  return { id: record.id, role: record.role, content: record.content, status: "done" };
}

/**
 * Read-only viewer for another user's conversation (admin-dashboard-contract.md section 4
 * and the privacy note above it). Reuses the existing ChatMessageList/ChatMessageBubble
 * components exactly as the normal chat workspace does — no composer, no send/stop/
 * regenerate wiring, so there is no way to inject a message into someone else's chat here.
 * The backend logs a server-side audit line whenever the underlying request succeeds.
 */
export function AdminUserConversationPage() {
  const { userId, conversationId } = useParams<{ userId: string; conversationId: string }>();
  const [messages, setMessages] = useState<AdminConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !conversationId) return;
    setIsLoading(true);
    setError(null);
    getAdminUserConversationMessages(userId, conversationId)
      .then(setMessages)
      .catch((err: unknown) => setError(normalizeApiError(err).message))
      .finally(() => setIsLoading(false));
  }, [userId, conversationId]);

  const chatMessages = useMemo(
    () => messages.map(toChatMessage).filter((message): message is ChatMessage => message !== null),
    [messages],
  );

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Conversation</h1>
        <Link to={`/app/admin/users/${userId}`}>Back to user</Link>
      </header>

      <div className="admin-banner" role="note">
        You&rsquo;re viewing another user&rsquo;s conversation as an admin. This access is logged.
      </div>

      <div className="admin-card admin-readonly-conversation">
        {isLoading ? <Spinner label="Loading conversation…" /> : null}
        {error ? <Alert message={error} /> : null}
        {!isLoading && !error ? <ChatMessageList messages={chatMessages} /> : null}
      </div>
    </div>
  );
}
