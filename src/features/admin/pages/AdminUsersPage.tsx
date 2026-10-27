import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../../components/Alert";
import { Spinner } from "../../../components/Spinner";
import { normalizeApiError } from "../../../lib/http";
import { listAdminUsers } from "../api/adminUsersApi";
import type { AdminUserSummary } from "../types/admin.types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Read-only user list (admin-dashboard-contract.md section 4). Clicking a row or "View"
 * drills into /app/admin/users/:userId. This is oversight tooling, not user management —
 * there is no edit/delete here.
 */
export function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminUsers()
      .then(setUsers)
      .catch((err: unknown) => setError(normalizeApiError(err).message))
      .finally(() => setIsLoading(false));
  }, []);

  const goToUser = (userId: string) => navigate(`/app/admin/users/${userId}`);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Users</h1>
      </header>

      <div className="admin-card">
        {isLoading ? <Spinner label="Loading users…" /> : null}
        {error ? <Alert message={error} /> : null}

        {!isLoading && !error && users.length === 0 ? <p className="admin-empty">No users found.</p> : null}

        {!isLoading && !error && users.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Verified</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Conversations</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="admin-table-row-clickable"
                    onClick={() => goToUser(user.id)}
                  >
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === "admin" ? "badge-info" : "badge-muted"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isVerified ? "badge-success" : "badge-muted"}`}>
                        {user.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{user.conversationCount}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToUser(user.id);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
