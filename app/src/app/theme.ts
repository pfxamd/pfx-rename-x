export type AppTheme = "light" | "dark";

const THEME_KEY = "pfx-rename-x-theme";

function isTheme(value: string | null): value is AppTheme {
  return value === "light" || value === "dark";
}

export function getInitialTheme(): AppTheme {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }

  return globalThis.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyTheme(theme: AppTheme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    globalThis.localStorage?.setItem(THEME_KEY, theme);
  } catch {
    // Theme still applies for the current session when storage is unavailable.
  }
}
