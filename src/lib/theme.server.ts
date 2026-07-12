import { cookies } from "next/headers";
import { isThemePreference, THEME_COOKIE, type ThemePreference } from "@/lib/theme";

export async function readThemePreference(): Promise<ThemePreference> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(THEME_COOKIE)?.value;
  return isThemePreference(raw) ? raw : "system";
}
