import type { UserRole } from "@/domain/user/user.entity";

declare module "@auth/core/types" {
  interface User {
    timezone: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      timezone: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    timezone: string;
    role: UserRole;
  }
}
