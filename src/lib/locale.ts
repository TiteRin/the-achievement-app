export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type LocalePreference = Locale | "system";

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "locale";

const LOCALE_PREFERENCES: readonly string[] = [...LOCALES, "system"];

export function isLocalePreference(
  value: string | undefined | null
): value is LocalePreference {
  return !!value && LOCALE_PREFERENCES.includes(value);
}

// Parses a raw `Accept-Language` header (e.g. "fr-FR,fr;q=0.9,en;q=0.8") and
// picks the first supported locale in the browser's preference order,
// matching region-tagged tags (`fr-FR`) to their base language (`fr`).
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => !!tag);

  for (const tag of preferred) {
    const match = LOCALES.find((locale) => tag === locale || tag.startsWith(`${locale}-`));
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

// One year — this is a light UI preference, not anything sensitive, so a
// long-lived cookie is fine and saves the person from re-picking it often.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function applyLocale(preference: LocalePreference): void {
  document.cookie = `${LOCALE_COOKIE}=${preference}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
