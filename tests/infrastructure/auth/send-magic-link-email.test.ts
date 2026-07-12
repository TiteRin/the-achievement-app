import { afterEach, describe, expect, it, vi } from "vitest";
import { User } from "@/domain/user/user.entity";
import { sendMagicLinkEmail } from "@/infrastructure/auth/send-magic-link-email";
import { InMemoryUserRepository } from "../../support/in-memory-repositories";

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock("nodemailer", () => ({
  createTransport: (...args: unknown[]) => createTransport(...args),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function baseParams(identifier: string) {
  return {
    identifier,
    url: `http://localhost:3000/api/auth/callback/nodemailer?token=abc&email=${identifier}`,
    provider: { server: { host: "localhost", port: 1025 }, from: "no-reply@example.com" },
  };
}

describe("sendMagicLinkEmail", () => {
  it("does not send an email for an unknown address", async () => {
    const userRepository = new InMemoryUserRepository();

    await sendMagicLinkEmail(userRepository, baseParams("ghost@example.com"));

    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends an email to an existing account", async () => {
    const userRepository = new InMemoryUserRepository();
    await userRepository.save(
      User.create({
        id: "user-1",
        email: "marine@example.com",
        timezone: "Europe/Paris",
        createdAt: new Date(),
      })
    );
    sendMail.mockResolvedValueOnce({ rejected: [], pending: [] });

    await sendMagicLinkEmail(userRepository, baseParams("marine@example.com"));

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: "marine@example.com" });
  });

  it("throws when the transport reports a rejected recipient", async () => {
    const userRepository = new InMemoryUserRepository();
    await userRepository.save(
      User.create({
        id: "user-1",
        email: "marine@example.com",
        timezone: "Europe/Paris",
        createdAt: new Date(),
      })
    );
    sendMail.mockResolvedValueOnce({ rejected: ["marine@example.com"], pending: [] });

    await expect(
      sendMagicLinkEmail(userRepository, baseParams("marine@example.com"))
    ).rejects.toThrow();
  });
});
