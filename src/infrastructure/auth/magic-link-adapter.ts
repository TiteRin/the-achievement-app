import type { Adapter, AdapterUser } from "next-auth/adapters";
import type { UserRepository } from "@/domain/user/user.repository";
import type { User } from "@/domain/user/user.entity";
import type { PrismaClient } from "@/infrastructure/prisma/generated/client";

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    // We don't track a separate "verified" state — an account existing at
    // all is already sufficient proof for our domain.
    emailVerified: null,
    timezone: user.timezone,
    role: user.role,
  };
}

/**
 * Minimal Adapter implementing only what the Nodemailer (magic-link)
 * provider needs, with JWT sessions — not a full @auth/prisma-adapter.
 * createSession/getSessionAndUser/updateSession/deleteSession are
 * intentionally not implemented: they're only called for the "database"
 * session strategy, which this app never uses.
 */
export function createMagicLinkAdapter(
  userRepository: UserRepository,
  client: PrismaClient
): Adapter {
  return {
    async createVerificationToken({ identifier, token, expires }) {
      return client.verificationToken.create({ data: { identifier, token, expires } });
    },

    async useVerificationToken({ identifier, token }) {
      try {
        return await client.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
      } catch {
        return null; // already consumed, expired-and-pruned, or never existed
      }
    },

    async getUserByEmail(email) {
      const user = await userRepository.findByEmail(email);
      return user ? toAdapterUser(user) : null;
    },

    async getUser(id) {
      const user = await userRepository.findById(id);
      return user ? toAdapterUser(user) : null;
    },

    async updateUser(partialUser) {
      const user = await userRepository.findById(partialUser.id);
      if (!user) throw new Error(`No user found for id ${partialUser.id}`);
      return toAdapterUser(user);
    },

    async createUser() {
      // Magic link is sign-in only for existing accounts (see
      // sendMagicLinkEmail, which never emails an unknown address).
      // Defense in depth: refuse explicitly if this is ever reached anyway.
      throw new Error(
        "Magic-link sign-up is not supported; accounts must be created via /signup"
      );
    },
  };
}
