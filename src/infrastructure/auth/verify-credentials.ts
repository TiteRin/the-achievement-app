import { User } from "@/domain/user/user.entity";
import { verifyPassword } from "./password";
import type { PrismaClient } from "@/infrastructure/prisma/generated/client";

export async function verifyCredentials(
  client: PrismaClient,
  params: { email: string; password: string }
): Promise<User | null> {
  const record = await client.user.findUnique({ where: { email: params.email } });
  if (!record || !record.passwordHash) return null;

  const passwordIsValid = await verifyPassword(params.password, record.passwordHash);
  if (!passwordIsValid) return null;

  return User.create({
    id: record.id,
    email: record.email,
    timezone: record.timezone,
    role: record.role,
    createdAt: record.createdAt,
  });
}
