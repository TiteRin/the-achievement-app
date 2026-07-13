import { cookies, headers } from "next/headers";
import {
  isLocalePreference,
  LOCALE_COOKIE,
  negotiateLocale,
  type Locale,
  type LocalePreference,
} from "@/lib/locale";

export async function readLocalePreference(): Promise<LocalePreference> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocalePreference(raw) ? raw : "system";
}

export async function resolveLocale(): Promise<Locale> {
  const preference = await readLocalePreference();
  if (preference !== "system") return preference;

  const headerStore = await headers();
  return negotiateLocale(headerStore.get("accept-language"));
}
