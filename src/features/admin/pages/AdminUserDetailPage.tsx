import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../../components/Alert";
import { Spinner } from "../../../components/Spinner";
import { normalizeApiError } from "../../../lib/http";
import { listAdminUserConversations, listAdminUsers } from "../api/adminUsersApi";
import type { AdminUserConversationSummary, AdminUserSummary } from "../types/admin.types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * A single user's basic info + their conversation list (admin-dashboard-contract.md
 * section 4). There is no `GET /api/admin/users/:userId` endpoint in the contract — only
 * a list and a per-user conversations endpoint — so the user's summary is looked up from
 * the same `GET /api/admin/users` list this page's parent already fetches once.
 */
export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<AdminUserSummary | null>(null);
  const [conversations, setConversations] = useState<AdminUserConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    Promise.all([listAdminUsers(), listAdminUserConversations(userId)])
      .then(([users, userConversations]) => {
        setUser(users.find((candidate) => candidate.id === userId) ?? null);
        setConversations(userConversations);
      })
      .catch((err: unknown) => setError(normalizeApiError(err).message))
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>User detail</h1>
        <Link to="/app/admin/users">Back to users</Link>
      </header>

      {isLoading ? <Spinner label="Loading user…" /> : null}
      {error ? <Alert message={error} /> : null}

      {!isLoading && !error && !user ? <Alert message="This user could not be found." /> : null}

      {!isLoading && !error && user ? (
        <div className="admin-card">
          <h2 className="admin-card-title">{user.name}</h2>
          <dl className="admin-detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <span className={`badge ${user.role === "admin" ? "badge-info" : "badge-muted"}`}>{user.role}</span>
              </dd>
            </div>
            <div>
              <dt>Verified</dt>
              <dd>
                <span className={`badge ${user.isVerified ? "badge-success" : "badge-muted"}`}>
                  {user.isVerified ? "Verified" : "Unverified"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {!isLoading && !error && user ? (
        <div className="admin-card">
          <h2 className="admin-card-title">Conversations</h2>
          {conversations.length === 0 ? (
            <p className="admin-empty">This user has no conversations yet.</p>
          ) : (
            <ul className="admin-conversation-list">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className="admin-conversation-row"
                    onClick={() => navigate(`/app/admin/users/${user.id}/conversations/${conversation.id}`)}
                  >
                    <span className="admin-conversation-title">{conversation.title ?? "New chat"}</span>
                    <span className="admin-conversation-meta">
                      {conversation.messageCount} message{conversation.messageCount === 1 ? "" : "s"} · updated{" "}
                      {formatDateTime(conversation.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
