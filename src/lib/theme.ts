// Per-viewer UI preference only (not sensitive data) — deliberately uses localStorage,
// unlike the auth token storage elsewhere in this app which avoids it. See the Settings
// page contract's "Appearance" section.
//
// "system" removes the explicit override and lets the existing `prefers-color-scheme`
// media query in index.css decide; "light"/"dark" stamp `data-theme` on <html> which the
// same stylesheet already reads (see the `:root[data-theme="dark"]` / `[data-theme="light"]`
// overrides added alongside the existing dark-mode media query).

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Reads the stored preference, defaulting to "system" if unset or unavailable. */
export function getStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** Applies a preference to the document immediately (no re-render needed). */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", preference);
  }
}

/** Persists the preference and applies it. Called from the Settings page's Appearance control. */
export function setTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage unavailable (private mode, quota, etc.) — still apply for this session.
  }
  applyTheme(preference);
}

/** Applies whatever is already stored. Called once as early as possible on boot. */
export function applyStoredTheme(): void {
  applyTheme(getStoredTheme());
}
