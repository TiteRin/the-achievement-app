import { describe, expect, it, afterEach } from "vitest";
import { applyTheme, isThemePreference, THEME_COOKIE } from "@/lib/theme";

function clearThemeCookie() {
  document.cookie = `${THEME_COOKIE}=; path=/; max-age=0`;
}

describe("isThemePreference", () => {
  it.each(["light", "dark", "system"])("accepts %s", (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([undefined, null, "", "sepia", "LIGHT"])(
    "rejects %s",
    (value) => {
      expect(isThemePreference(value)).toBe(false);
    }
  );
});

describe("applyTheme", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    clearThemeCookie();
  });

  it("sets data-theme and persists the cookie for an explicit choice", () => {
    applyTheme("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });

  it("clears data-theme when switching back to system, but still persists the choice", () => {
    applyTheme("light");
    applyTheme("system");

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).toContain(`${THEME_COOKIE}=system`);
  });
});
