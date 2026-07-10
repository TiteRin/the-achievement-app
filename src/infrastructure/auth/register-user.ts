import { User } from "@/domain/user/user.entity";
import { hashPassword } from "./password";
import { Prisma, type PrismaClient } from "@/infrastructure/prisma/generated/client";

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = "EmailAlreadyRegisteredError";
  }
}

export async function registerUser(
  client: PrismaClient,
  params: { email: string; password: string; timezone: string; now: Date }
): Promise<User> {
  const passwordHash = await hashPassword(params.password);

  try {
    const record = await client.user.create({
      data: {
        email: params.email,
        timezone: params.timezone,
        passwordHash,
        createdAt: params.now,
      },
    });

    return User.create({
      id: record.id,
      email: record.email,
      timezone: record.timezone,
      role: record.role,
      createdAt: record.createdAt,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new EmailAlreadyRegisteredError(params.email);
    }
    throw error;
  }
}
