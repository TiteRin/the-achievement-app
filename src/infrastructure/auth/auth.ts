import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/infrastructure/prisma/prisma-user.repository";
import { verifyCredentials } from "./verify-credentials";
import { syncConfiguredAdminRole } from "./sync-admin-role";
import { createMagicLinkAdapter } from "./magic-link-adapter";
import { sendMagicLinkEmail } from "./send-magic-link-email";

const userRepository = new PrismaUserRepository(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  adapter: createMagicLinkAdapter(userRepository, prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await verifyCredentials(prisma, { email, password });
        if (!user) return null;

        const synced = await syncConfiguredAdminRole(prisma, user);

        return {
          id: synced.id,
          email: synced.email,
          timezone: synced.timezone,
          role: synced.role,
        };
      },
    }),
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? "587"),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      },
      from: process.env.SMTP_FROM ?? "The Achievement App <no-reply@localhost>",
      sendVerificationRequest: (params) => sendMagicLinkEmail(userRepository, params),
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.timezone = user.timezone;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.timezone = token.timezone;
      session.user.role = token.role;
      return session;
    },
  },
});
