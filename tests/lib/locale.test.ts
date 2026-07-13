import { describe, expect, it, afterEach } from "vitest";
import {
  applyLocale,
  isLocalePreference,
  LOCALE_COOKIE,
  negotiateLocale,
} from "@/lib/locale";

function clearLocaleCookie() {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
}

describe("isLocalePreference", () => {
  it.each(["fr", "en", "system"])("accepts %s", (value) => {
    expect(isLocalePreference(value)).toBe(true);
  });

  it.each([undefined, null, "", "de", "FR"])("rejects %s", (value) => {
    expect(isLocalePreference(value)).toBe(false);
  });
});

describe("negotiateLocale", () => {
  it("returns the default locale when there is no header", () => {
    expect(negotiateLocale(null)).toBe("fr");
    expect(negotiateLocale(undefined)).toBe("fr");
  });

  it("picks french from a plain fr header", () => {
    expect(negotiateLocale("fr")).toBe("fr");
  });

  it("picks english from a plain en header", () => {
    expect(negotiateLocale("en")).toBe("en");
  });

  it("matches region-tagged locales to their base language", () => {
    expect(negotiateLocale("fr-FR,fr;q=0.9")).toBe("fr");
    expect(negotiateLocale("en-US,en;q=0.9")).toBe("en");
  });

  it("respects quality-ordered preference, picking the first supported match", () => {
    expect(negotiateLocale("de-DE,de;q=0.9,en;q=0.8,fr;q=0.7")).toBe("en");
  });

  it("falls back to the default locale when nothing supported matches", () => {
    expect(negotiateLocale("de-DE,es-ES")).toBe("fr");
  });
});

describe("applyLocale", () => {
  afterEach(() => {
    clearLocaleCookie();
  });

  it("persists an explicit locale choice in the cookie", () => {
    applyLocale("en");
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
  });

  it("persists system back to the cookie too", () => {
    applyLocale("fr");
    applyLocale("system");
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=system`);
  });
});
