import { describe, expect, it } from "vitest";
import { User, InvalidTimezoneError } from "@/domain/user/user.entity";

const baseParams = {
  id: "user-1",
  email: "marine@example.com",
  createdAt: new Date("2026-03-05T10:00:00Z"),
};

describe("User.create", () => {
  it("creates a user with a valid IANA timezone", () => {
    const user = User.create({
      ...baseParams,
      timezone: "Europe/Paris",
      role: "user",
    });
    expect(user.timezone).toBe("Europe/Paris");
    expect(user.role).toBe("user");
  });

  it("defaults to the 'user' role when not provided", () => {
    const user = User.create({ ...baseParams, timezone: "Europe/Paris" });
    expect(user.role).toBe("user");
  });

  it("rejects an invalid timezone", () => {
    expect(() =>
      User.create({ ...baseParams, timezone: "Not/ATimezone" })
    ).toThrow(InvalidTimezoneError);
  });
});
