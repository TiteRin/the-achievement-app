import type { UserRepository } from "@/domain/user/user.repository";
import { User } from "@/domain/user/user.entity";
import type { PrismaClient } from "./generated/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.client.user.findUnique({ where: { id } });
    if (!record) return null;
    return toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.client.user.findUnique({ where: { email } });
    if (!record) return null;
    return toDomain(record);
  }

  async findAll(): Promise<User[]> {
    const records = await this.client.user.findMany({ orderBy: { createdAt: "asc" } });
    return records.map(toDomain);
  }
}

function toDomain(record: {
  id: string;
  email: string;
  timezone: string;
  role: "user" | "admin";
  createdAt: Date;
}): User {
  return User.create({
    id: record.id,
    email: record.email,
    timezone: record.timezone,
    role: record.role,
    createdAt: record.createdAt,
  });
}
