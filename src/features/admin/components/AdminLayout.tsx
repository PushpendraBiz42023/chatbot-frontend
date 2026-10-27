import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { UserMenu } from "../../../components/UserMenu";

const NAV_LINKS = [
  { to: "/app/admin", label: "Dashboard", end: true },
  { to: "/app/admin/users", label: "Users", end: false },
  { to: "/app/admin/knowledge", label: "Knowledge", end: false },
  { to: "/app/admin/documents", label: "Documents", end: false },
  { to: "/app/admin/providers", label: "Providers", end: false },
];

/**
 * Persistent shell for the five admin pages (Dashboard/Users/Knowledge/Documents/Providers),
 * rendered via a layout route + <Outlet/> in App.tsx. Reuses the EXACT collapsible
 * off-canvas drawer mechanism already built for the chat sidebar (same `chat-sidebar`/
 * `chat-sidebar-open`/`chat-sidebar-backdrop`/`chat-sidebar-toggle`/`chat-header`/
 * `chat-body`/`chat-main` CSS, including its `@media (max-width: 800px)` breakpoint) —
 * only the nav content inside is admin-specific, per admin-dashboard-contract.md section 2.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="chat-workspace">
      <header className="chat-header">
        <div className="chat-header-left">
          <button
            type="button"
            className="chat-sidebar-toggle"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <span className="landing-brand">ChatBot Admin</span>
        </div>
        <div className="chat-header-right">
          <Link to="/app" className="chat-admin-link">
            ← Back to Chat
          </Link>
          <UserMenu user={user} onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />
        </div>
      </header>

      <div className="chat-body">
        {isSidebarOpen ? (
          <div className="chat-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
        ) : null}
        <aside className={`chat-sidebar ${isSidebarOpen ? "chat-sidebar-open" : ""}`} aria-label="Admin navigation">
          <nav aria-label="Admin sections">
            <ul className="admin-nav-list">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      ["admin-nav-link", isActive ? "admin-nav-link-active" : ""].filter(Boolean).join(" ")
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="chat-main admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
