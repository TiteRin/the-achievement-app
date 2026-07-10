// @vitest-environment node
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { registerUser } from "@/infrastructure/auth/register-user";
import { verifyCredentials } from "@/infrastructure/auth/verify-credentials";
import { User } from "@/domain/user/user.entity";

const EMAIL_SUFFIX = "@verify-credentials.test.local";

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("verifyCredentials", () => {
  it("returns the domain User for correct credentials", async () => {
    const email = `ok-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    await registerUser(prisma, {
      email,
      password: "correct horse battery staple",
      timezone: "Europe/Paris",
      now: new Date(),
    });

    const user = await verifyCredentials(prisma, {
      email,
      password: "correct horse battery staple",
    });

    expect(user).toBeInstanceOf(User);
    expect(user?.email).toBe(email);
  });

  it("returns null for a wrong password", async () => {
    const email = `wrongpw-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    await registerUser(prisma, {
      email,
      password: "correct horse battery staple",
      timezone: "Europe/Paris",
      now: new Date(),
    });

    const user = await verifyCredentials(prisma, {
      email,
      password: "not the password",
    });

    expect(user).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const user = await verifyCredentials(prisma, {
      email: `nobody-${crypto.randomUUID()}${EMAIL_SUFFIX}`,
      password: "whatever",
    });

    expect(user).toBeNull();
  });
});
