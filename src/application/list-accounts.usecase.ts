import type { UserRepository } from "@/domain/user/user.repository";
import type { UserRole } from "@/domain/user/user.entity";

export type AccountDto = {
  id: string;
  email: string;
  timezone: string;
  role: UserRole;
  createdAt: Date;
};

export async function listAccounts(
  userRepository: UserRepository
): Promise<AccountDto[]> {
  const users = await userRepository.findAll();
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    timezone: user.timezone,
    role: user.role,
    createdAt: user.createdAt,
  }));
}
