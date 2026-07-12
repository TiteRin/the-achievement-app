// @vitest-environment node
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/infrastructure/prisma/prisma-user.repository";
import { createMagicLinkAdapter } from "@/infrastructure/auth/magic-link-adapter";

const EMAIL_SUFFIX = "@magic-link-adapter.test.local";
const userRepository = new PrismaUserRepository(prisma);
const adapter = createMagicLinkAdapter(userRepository, prisma);

async function createUser(email: string) {
  return prisma.user.create({ data: { email, timezone: "Europe/Paris", role: "admin" } });
}

afterEach(async () => {
  await prisma.verificationToken.deleteMany({ where: { identifier: { endsWith: EMAIL_SUFFIX } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createMagicLinkAdapter", () => {
  describe("verification tokens", () => {
    it("creates a token then consumes it exactly once", async () => {
      const identifier = `token-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
      const token = "hashed-token-value";
      const expires = new Date(Date.now() + 60_000);

      await adapter.createVerificationToken!({ identifier, token, expires });

      const consumed = await adapter.useVerificationToken!({ identifier, token });
      expect(consumed).toMatchObject({ identifier, token });

      const consumedAgain = await adapter.useVerificationToken!({ identifier, token });
      expect(consumedAgain).toBeNull();
    });

    it("returns null when consuming a token that was never created", async () => {
      const result = await adapter.useVerificationToken!({
        identifier: `nobody-${crypto.randomUUID()}${EMAIL_SUFFIX}`,
        token: "does-not-exist",
      });
      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail / getUser", () => {
    it("returns an AdapterUser with timezone and role for an existing account", async () => {
      const record = await createUser(`byemail-${crypto.randomUUID()}${EMAIL_SUFFIX}`);

      const byEmail = await adapter.getUserByEmail!(record.email);
      const byId = await adapter.getUser!(record.id);

      expect(byEmail).toMatchObject({
        id: record.id,
        email: record.email,
        timezone: "Europe/Paris",
        role: "admin",
        emailVerified: null,
      });
      expect(byId).toMatchObject({ id: record.id, email: record.email });
    });

    it("returns null for an unknown email or id", async () => {
      expect(await adapter.getUserByEmail!(`ghost-${crypto.randomUUID()}${EMAIL_SUFFIX}`)).toBeNull();
      expect(await adapter.getUser!(crypto.randomUUID())).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("returns the current user without erroring", async () => {
      const record = await createUser(`update-${crypto.randomUUID()}${EMAIL_SUFFIX}`);

      const result = await adapter.updateUser!({
        id: record.id,
        email: record.email,
        emailVerified: new Date(),
      });

      expect(result).toMatchObject({ id: record.id, email: record.email });
    });
  });

  describe("createUser", () => {
    it("always refuses — magic link never auto-creates an account", async () => {
      await expect(
        adapter.createUser!({
          id: crypto.randomUUID(),
          email: `new-${crypto.randomUUID()}${EMAIL_SUFFIX}`,
          emailVerified: null,
        })
      ).rejects.toThrow();
    });
  });
});
