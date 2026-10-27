import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../features/admin/api/adminApi";
import { normalizeApiError } from "../lib/http";
import type { AdminStats } from "../features/admin/types/admin.types";

const TILES: Array<{ key: keyof AdminStats; label: string }> = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalConversations", label: "Total Conversations" },
  { key: "totalKnowledgeEntries", label: "Knowledge Entries" },
  { key: "totalDocuments", label: "Documents" },
];

/**
 * Admin dashboard (admin-dashboard-contract.md section 3): a stat-tile row from
 * GET /api/admin/stats, plus quick-link cards to the other admin sections.
 */
export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err: unknown) => setError(normalizeApiError(err).message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Admin dashboard</h1>
      </header>

      {error ? <div className="admin-card"><p className="field-error">{error}</p></div> : null}

      <div className="admin-stat-grid">
        {TILES.map((tile) => (
          <div className="admin-stat-tile" key={tile.key}>
            <p className="admin-stat-tile-value">
              {isLoading ? <span className="admin-stat-skeleton" aria-hidden="true" /> : error ? "—" : stats?.[tile.key]}
            </p>
            <p className="admin-stat-tile-label">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-quicklink-grid">
        <Link to="/app/admin/users" className="admin-card admin-quicklink">
          <h2 className="admin-card-title">Users</h2>
          <p className="admin-empty">View registered users and inspect their conversation history.</p>
        </Link>
        <Link to="/app/admin/knowledge" className="admin-card admin-quicklink">
          <h2 className="admin-card-title">Knowledge base</h2>
          <p className="admin-empty">Manage manually-curated knowledge entries used to ground chat answers.</p>
        </Link>
        <Link to="/app/admin/documents" className="admin-card admin-quicklink">
          <h2 className="admin-card-title">Documents</h2>
          <p className="admin-empty">Upload PDFs, Word docs, text files, or images to ground chat answers.</p>
        </Link>
      </div>
    </div>
  );
}
