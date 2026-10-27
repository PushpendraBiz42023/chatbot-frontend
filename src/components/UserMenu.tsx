import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../features/auth/types/auth.types";

interface UserMenuProps {
  user: User | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

function initialOf(user: User | null): string {
  const source = user?.name?.trim() || user?.email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

/**
 * Keyboard-accessible dropdown used in both the chat header (AppPage) and the admin
 * header (AdminLayout) — one component, shared, per the admin-dashboard-contract.
 * Follows the same a11y bar as PasswordField/CopyButton: a real <button> trigger with
 * aria-haspopup/aria-expanded, closes on Escape and outside-click, restores focus to the
 * trigger on close.
 */
export function UserMenu({ user, onLogout, isLoggingOut = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const close = (restoreFocus: boolean) => {
    setIsOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    }
  };

  const goToSettings = () => {
    close(false);
    navigate("/app/settings");
  };

  const handleLogout = () => {
    close(false);
    onLogout();
  };

  return (
    <div className="user-menu" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="user-menu-avatar" aria-hidden="true">
          {initialOf(user)}
        </span>
        <span className="user-menu-label">{user?.name || user?.email}</span>
        <span className="user-menu-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <p className="user-menu-name">{user?.name}</p>
            <p className="user-menu-email">{user?.email}</p>
          </div>
          <button type="button" role="menuitem" className="user-menu-item" onClick={goToSettings}>
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="user-menu-item user-menu-item-danger"
            disabled={isLoggingOut}
            onClick={handleLogout}
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
