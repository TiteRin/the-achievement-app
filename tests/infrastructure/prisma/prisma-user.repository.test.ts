// @vitest-environment node
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/infrastructure/prisma/prisma-user.repository";
import { User } from "@/domain/user/user.entity";

const EMAIL_SUFFIX = "@user-repo.test.local";
const repository = new PrismaUserRepository(prisma);

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaUserRepository", () => {
  it("returns null when the user does not exist", async () => {
    const result = await repository.findById(crypto.randomUUID());
    expect(result).toBeNull();
  });

  it("finds a user previously inserted in the database", async () => {
    const created = await prisma.user.create({
      data: {
        email: `find-${crypto.randomUUID()}${EMAIL_SUFFIX}`,
        timezone: "Europe/Paris",
        role: "user",
      },
    });

    const found = await repository.findById(created.id);

    expect(found).toBeInstanceOf(User);
    expect(found?.email).toBe(created.email);
    expect(found?.timezone).toBe("Europe/Paris");
    expect(found?.role).toBe("user");
  });

  describe("findAll", () => {
    it("includes every user, regardless of who created them", async () => {
      const emailA = `all-a-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
      const emailB = `all-b-${crypto.randomUUID()}${EMAIL_SUFFIX}`;
      await prisma.user.create({ data: { email: emailA, timezone: "Europe/Paris" } });
      await prisma.user.create({ data: { email: emailB, timezone: "Europe/Paris", role: "admin" } });

      const result = await repository.findAll();

      const emails = result.map((user) => user.email);
      expect(emails).toEqual(expect.arrayContaining([emailA, emailB]));
      expect(result.every((user) => user instanceof User)).toBe(true);
    });
  });
});
