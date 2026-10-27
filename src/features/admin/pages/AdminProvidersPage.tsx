import { useEffect, useState } from "react";
import { Alert } from "../../../components/Alert";
import { Spinner } from "../../../components/Spinner";
import { normalizeApiError } from "../../../lib/http";
import { providerLabel } from "../../chat/utils/providerLabels";
import { getAdminProvidersStatus, getAdminProvidersUsage } from "../api/adminProvidersApi";
import type { AdminProviderStatus, AdminProviderUsage } from "../types/admin.types";
import type { ProviderRuntimeStatus } from "../../chat/types/chat.types";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTokens(value: number | null): string {
  return value === null ? "—" : value.toLocaleString();
}

/** Maps a provider's runtime status to the colored-dot variant + a short human label. */
function statusPresentation(entry: AdminProviderStatus): { dotClass: string; label: string } {
  if (!entry.configured) return { dotClass: "admin-status-dot-muted", label: "Not configured" };

  const byStatus: Partial<Record<ProviderRuntimeStatus, { dotClass: string; label: string }>> = {
    available: { dotClass: "admin-status-dot-available", label: "Available" },
    temporarily_rate_limited: { dotClass: "admin-status-dot-warning", label: "Rate-limited" },
    quota_exhausted: { dotClass: "admin-status-dot-error", label: "Quota exhausted" },
    unavailable: { dotClass: "admin-status-dot-error", label: "Unavailable" },
    configuration_error: { dotClass: "admin-status-dot-error", label: "Configuration error" },
    authentication_error: { dotClass: "admin-status-dot-error", label: "Authentication error" },
    network_error: { dotClass: "admin-status-dot-warning", label: "Network error" },
    unknown_error: { dotClass: "admin-status-dot-error", label: "Unknown error" },
  };

  return byStatus[entry.status] ?? { dotClass: "admin-status-dot-error", label: entry.status };
}

/**
 * Admin "Providers" page (multi-provider-contract.md section 6/9): per-provider live status
 * (colored dot, last error, last success/failure) plus an aggregated usage table. Follows the
 * exact conventions of the other admin pages (`admin-page`/`admin-card`/`admin-table`) — no new
 * layout primitives invented. Read-only, admin-only (enforced server-side by `requireAdmin`;
 * `AdminRoute` merely hides the nav link/route client-side, same convention as the rest of the
 * admin dashboard).
 */
export function AdminProvidersPage() {
  const [statuses, setStatuses] = useState<AdminProviderStatus[]>([]);
  const [usage, setUsage] = useState<AdminProviderUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAdminProvidersStatus(), getAdminProvidersUsage()])
      .then(([statusList, usageList]) => {
        setStatuses(statusList);
        setUsage(usageList);
      })
      .catch((err: unknown) => setError(normalizeApiError(err).message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Providers</h1>
      </header>

      <div className="admin-card">
        <h2 className="admin-card-title">Status</h2>

        {isLoading ? <Spinner label="Loading provider status…" /> : null}
        {error ? <Alert message={error} /> : null}

        {!isLoading && !error && statuses.length === 0 ? <p className="admin-empty">No provider data yet.</p> : null}

        {!isLoading && !error && statuses.length > 0 ? (
          <div className="admin-status-list">
            {statuses.map((entry) => {
              const { dotClass, label } = statusPresentation(entry);
              return (
                <div className="admin-status-row" key={entry.provider}>
                  <span className={`admin-status-dot ${dotClass}`} aria-hidden="true" />
                  <div className="admin-status-info">
                    <span className="admin-status-name">
                      {providerLabel(entry.provider)} · {label}
                    </span>
                    <span className="admin-status-meta">Model: {entry.model || "—"}</span>
                    {entry.lastError ? <span className="admin-status-meta">Last error: {entry.lastError}</span> : null}
                    <span className="admin-status-meta">
                      Last success: {formatDateTime(entry.lastSuccessAt)} · Last failure:{" "}
                      {formatDateTime(entry.lastFailureAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Usage</h2>

        {!isLoading && !error && usage.length === 0 ? <p className="admin-empty">No usage recorded yet.</p> : null}

        {!isLoading && !error && usage.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Provider</th>
                  <th scope="col">Model</th>
                  <th scope="col">Requests</th>
                  <th scope="col">Success</th>
                  <th scope="col">Rate-limited</th>
                  <th scope="col">Quota</th>
                  <th scope="col">Timeouts</th>
                  <th scope="col">Server errors</th>
                  <th scope="col">Other errors</th>
                  <th scope="col">Input tokens</th>
                  <th scope="col">Output tokens</th>
                  <th scope="col">Last success</th>
                  <th scope="col">Last failure</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={`${row.provider}-${row.model}`}>
                    <td>{providerLabel(row.provider)}</td>
                    <td>{row.model}</td>
                    <td>{row.totalRequests}</td>
                    <td>{row.successfulRequests}</td>
                    <td>{row.rateLimitErrors}</td>
                    <td>{row.quotaErrors}</td>
                    <td>{row.timeouts}</td>
                    <td>{row.serverErrors}</td>
                    <td>{row.otherErrors}</td>
                    <td>{formatTokens(row.totalInputTokens)}</td>
                    <td>{formatTokens(row.totalOutputTokens)}</td>
                    <td>{formatDateTime(row.lastSuccessAt)}</td>
                    <td>{formatDateTime(row.lastFailureAt)}</td>
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
