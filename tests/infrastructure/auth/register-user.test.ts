// @vitest-environment node
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { registerUser, EmailAlreadyRegisteredError } from "@/infrastructure/auth/register-user";
import { User } from "@/domain/user/user.entity";

const EMAIL_SUFFIX = "@register-user.test.local";

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("registerUser", () => {
  it("creates a user with a hashed password and returns the domain User", async () => {
    const email = `new-${crypto.randomUUID()}${EMAIL_SUFFIX}`;

    const user = await registerUser(prisma, {
      email,
      password: "correct horse battery staple",
      timezone: "Europe/Paris",
      now: new Date("2026-03-05T10:00:00Z"),
    });

    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe(email);
    expect(user.role).toBe("user");

    const record = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(record.passwordHash).not.toBeNull();
    expect(record.passwordHash).not.toBe("correct horse battery staple");
  });

  it("rejects registering the same email twice", async () => {
    const email = `dup-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
    const params = {
      email,
      password: "correct horse battery staple",
      timezone: "Europe/Paris",
      now: new Date("2026-03-05T10:00:00Z"),
    };

    await registerUser(prisma, params);

    await expect(registerUser(prisma, params)).rejects.toThrow(
      EmailAlreadyRegisteredError
    );
  });
});
