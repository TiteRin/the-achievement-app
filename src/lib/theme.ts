export type ThemePreference = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";

const THEME_PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

export function isThemePreference(
  value: string | undefined | null
): value is ThemePreference {
  return !!value && (THEME_PREFERENCES as readonly string[]).includes(value);
}

// One year — this is a light UI preference, not anything sensitive, so a
// long-lived cookie is fine and saves the person from re-picking it often.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function applyTheme(theme: ThemePreference): void {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
