// @vitest-environment node
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { syncConfiguredAdminRole } from "@/infrastructure/auth/sync-admin-role";
import { User } from "@/domain/user/user.entity";

const EMAIL_SUFFIX = "@sync-admin-role.test.local";

async function createUser(email: string, role: "user" | "admin" = "user") {
  const record = await prisma.user.create({
    data: { email, timezone: "Europe/Paris", role },
  });
  return User.create({
    id: record.id,
    email: record.email,
    timezone: record.timezone,
    role: record.role,
    createdAt: record.createdAt,
  });
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("syncConfiguredAdminRole", () => {
  it("promotes a user whose email is in ADMIN_EMAILS", async () => {
    const email = `promote-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    const user = await createUser(email);
    vi.stubEnv("ADMIN_EMAILS", email);

    const result = await syncConfiguredAdminRole(prisma, user);

    expect(result.role).toBe("admin");
    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(record.role).toBe("admin");
  });

  it("matches case-insensitively", async () => {
    const email = `case-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    const user = await createUser(email);
    vi.stubEnv("ADMIN_EMAILS", email.toUpperCase());

    const result = await syncConfiguredAdminRole(prisma, user);

    expect(result.role).toBe("admin");
  });

  it("does not touch the role when the email is not configured", async () => {
    const email = `not-configured-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    const user = await createUser(email);
    vi.stubEnv("ADMIN_EMAILS", "someone-else@example.com");

    const result = await syncConfiguredAdminRole(prisma, user);

    expect(result.role).toBe("user");
    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(record.role).toBe("user");
  });

  it("never demotes an existing admin, even if absent from ADMIN_EMAILS", async () => {
    const email = `already-admin-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    const user = await createUser(email, "admin");
    vi.stubEnv("ADMIN_EMAILS", "");

    const result = await syncConfiguredAdminRole(prisma, user);

    expect(result.role).toBe("admin");
    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(record.role).toBe("admin");
  });
});
