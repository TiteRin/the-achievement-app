import { User } from "@/domain/user/user.entity";
import { isConfiguredAdminEmail } from "./admin-emails";
import type { PrismaClient } from "@/infrastructure/prisma/generated/client";

export async function syncConfiguredAdminRole(
  client: PrismaClient,
  user: User
): Promise<User> {
  if (user.role === "admin" || !isConfiguredAdminEmail(user.email)) {
    return user;
  }

  const record = await client.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  return User.create({
    id: record.id,
    email: record.email,
    timezone: record.timezone,
    role: record.role,
    createdAt: record.createdAt,
  });
}
