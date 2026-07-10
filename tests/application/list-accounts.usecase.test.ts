import { describe, expect, it } from "vitest";
import { User } from "@/domain/user/user.entity";
import { listAccounts } from "@/application/list-accounts.usecase";
import { InMemoryUserRepository } from "../support/in-memory-repositories";

describe("listAccounts", () => {
  it("returns an empty list when there are no accounts", async () => {
    const userRepository = new InMemoryUserRepository();

    const result = await listAccounts(userRepository);

    expect(result).toEqual([]);
  });

  it("returns every account as a plain DTO", async () => {
    const userRepository = new InMemoryUserRepository();
    const createdAt = new Date("2026-03-05T09:00:00Z");
    await userRepository.save(
      User.create({
        id: "user-1",
        email: "marine@example.com",
        timezone: "Europe/Paris",
        role: "user",
        createdAt,
      })
    );
    await userRepository.save(
      User.create({
        id: "user-2",
        email: "admin@example.com",
        timezone: "Europe/Paris",
        role: "admin",
        createdAt,
      })
    );

    const result = await listAccounts(userRepository);

    expect(result).toEqual([
      {
        id: "user-1",
        email: "marine@example.com",
        timezone: "Europe/Paris",
        role: "user",
        createdAt,
      },
      {
        id: "user-2",
        email: "admin@example.com",
        timezone: "Europe/Paris",
        role: "admin",
        createdAt,
      },
    ]);
  });
});
