import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/Button";
import {
  deleteConversation,
  listConversations,
  renameConversation,
} from "../api/conversationsApi";
import type { Conversation } from "../types/chat.types";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  /** The route's current `:conversationId`, if any — used to highlight the active row. */
  activeConversationId?: string;
  /** Bump this (e.g. a counter) whenever a new conversation should be pulled into the list. */
  refreshSignal?: number;
  /** Called after the currently-open conversation is deleted, so the page can clear its state. */
  onActiveConversationDeleted?: () => void;
}

type Group = "Today" | "Yesterday" | "Previous 7 Days" | "Older";
const GROUP_ORDER: Group[] = ["Today", "Yesterday", "Previous 7 Days", "Older"];

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupFor(updatedAt: string): Group {
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(updatedAt))) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 Days";
  return "Older";
}

function groupConversations(conversations: Conversation[]): Array<[Group, Conversation[]]> {
  const buckets = new Map<Group, Conversation[]>();
  for (const conversation of conversations) {
    const group = groupFor(conversation.updatedAt);
    const bucket = buckets.get(group);
    if (bucket) bucket.push(conversation);
    else buckets.set(group, [conversation]);
  }
  return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => [group, buckets.get(group) as Conversation[]]);
}

/**
 * Real conversation list (Day 3): fetched from GET /api/conversations, grouped by recency,
 * with inline rename and delete affordances. Replaces the Day 2 "no fake history" placeholder.
 */
export function ChatSidebar({
  isOpen,
  onClose,
  onNewChat,
  activeConversationId,
  refreshSignal,
  onActiveConversationDeleted,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    listConversations()
      .then(setConversations)
      .catch(() => setLoadError("Unable to load your chats."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch, refreshSignal]);

  const startEditing = (conversation: Conversation) => {
    setPendingDeleteId(null);
    setEditingId(conversation.id);
    setEditingValue(conversation.title ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const saveEditing = async (id: string) => {
    const title = editingValue.trim();
    if (!title) {
      cancelEditing();
      return;
    }
    setBusyId(id);
    try {
      const updated = await renameConversation(id, title);
      setConversations((prev) => prev.map((conversation) => (conversation.id === id ? updated : conversation)));
    } catch {
      setLoadError("Unable to rename this chat. Please try again.");
    } finally {
      setBusyId(null);
      cancelEditing();
    }
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveEditing(id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const confirmDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
      if (id === activeConversationId) {
        onActiveConversationDeleted?.();
      }
    } catch {
      setLoadError("Unable to delete this chat. Please try again.");
    } finally {
      setBusyId(null);
      setPendingDeleteId(null);
    }
  };

  const handleSelect = (id: string) => {
    navigate(`/app/chat/${id}`);
    onClose();
  };

  const groups = groupConversations(conversations);

  return (
    <>
      {isOpen ? <div className="chat-sidebar-backdrop" onClick={onClose} aria-hidden="true" /> : null}
      <aside className={`chat-sidebar ${isOpen ? "chat-sidebar-open" : ""}`} aria-label="Chat navigation">
        <Button variant="secondary" className="btn-block" onClick={onNewChat}>
          + New chat
        </Button>

        {loadError ? <p className="chat-sidebar-note chat-sidebar-error">{loadError}</p> : null}
        {isLoading ? <p className="chat-sidebar-note">Loading your chats…</p> : null}
        {!isLoading && !loadError && conversations.length === 0 ? (
          <p className="chat-sidebar-note">Your conversations will show up here once you start chatting.</p>
        ) : null}

        <nav className="chat-history" aria-label="Conversation history">
          {groups.map(([group, items]) => (
            <div key={group} className="chat-history-group">
              <h3 className="chat-history-group-label">{group}</h3>
              <ul className="chat-history-list">
                {items.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  const isEditing = editingId === conversation.id;
                  const isPendingDelete = pendingDeleteId === conversation.id;
                  const isBusy = busyId === conversation.id;
                  const title = conversation.title ?? "New chat";

                  return (
                    <li key={conversation.id} className="chat-history-item">
                      {isEditing ? (
                        <input
                          autoFocus
                          className="chat-history-edit-input"
                          value={editingValue}
                          disabled={isBusy}
                          maxLength={200}
                          aria-label="Rename chat"
                          onChange={(event) => setEditingValue(event.target.value)}
                          onKeyDown={(event) => handleEditKeyDown(event, conversation.id)}
                          onBlur={() => void saveEditing(conversation.id)}
                        />
                      ) : (
                        <button
                          type="button"
                          className={["chat-history-button", isActive ? "chat-history-button-active" : ""]
                            .filter(Boolean)
                            .join(" ")}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => handleSelect(conversation.id)}
                        >
                          {title}
                        </button>
                      )}

                      {!isEditing && !isPendingDelete ? (
                        <div className="chat-history-actions">
                          <button
                            type="button"
                            className="chat-history-icon-btn"
                            aria-label={`Rename "${title}"`}
                            onClick={() => startEditing(conversation)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="chat-history-icon-btn"
                            aria-label={`Delete "${title}"`}
                            onClick={() => setPendingDeleteId(conversation.id)}
                          >
                            🗑
                          </button>
                        </div>
                      ) : null}

                      {isPendingDelete ? (
                        <div className="chat-history-confirm">
                          <span>Delete this chat?</span>
                          <button
                            type="button"
                            className="chat-history-confirm-btn"
                            disabled={isBusy}
                            aria-label={`Confirm deleting "${title}"`}
                            onClick={() => void confirmDelete(conversation.id)}
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            className="chat-history-confirm-btn"
                            disabled={isBusy}
                            aria-label="Cancel delete"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
