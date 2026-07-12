// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { isConfiguredAdminEmail } from "@/infrastructure/auth/admin-emails";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isConfiguredAdminEmail", () => {
  it("returns false when ADMIN_EMAILS is unset", () => {
    vi.stubEnv("ADMIN_EMAILS", undefined);
    expect(isConfiguredAdminEmail("marine@example.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is empty", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isConfiguredAdminEmail("marine@example.com")).toBe(false);
  });

  it("returns true for an email listed in ADMIN_EMAILS", () => {
    vi.stubEnv("ADMIN_EMAILS", "marine@example.com,other@example.com");
    expect(isConfiguredAdminEmail("marine@example.com")).toBe(true);
    expect(isConfiguredAdminEmail("other@example.com")).toBe(true);
  });

  it("returns false for an email not listed", () => {
    vi.stubEnv("ADMIN_EMAILS", "marine@example.com");
    expect(isConfiguredAdminEmail("someone-else@example.com")).toBe(false);
  });

  it("matches case-insensitively", () => {
    vi.stubEnv("ADMIN_EMAILS", "Marine@Example.com");
    expect(isConfiguredAdminEmail("marine@example.com")).toBe(true);
    expect(isConfiguredAdminEmail("MARINE@EXAMPLE.COM")).toBe(true);
  });

  it("trims whitespace around entries and ignores empty entries", () => {
    vi.stubEnv("ADMIN_EMAILS", " marine@example.com , , other@example.com ,");
    expect(isConfiguredAdminEmail("marine@example.com")).toBe(true);
    expect(isConfiguredAdminEmail("other@example.com")).toBe(true);
  });
});
