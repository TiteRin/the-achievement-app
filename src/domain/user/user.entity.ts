export type UserRole = "user" | "admin";

export class InvalidTimezoneError extends Error {
  constructor(timezone: string) {
    super(`Invalid IANA timezone: ${timezone}`);
    this.name = "InvalidTimezoneError";
  }
}

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly timezone: string,
    readonly role: UserRole,
    readonly createdAt: Date
  ) {}

  static create(params: {
    id: string;
    email: string;
    timezone: string;
    role?: UserRole;
    createdAt: Date;
  }): User {
    assertValidTimezone(params.timezone);
    return new User(
      params.id,
      params.email,
      params.timezone,
      params.role ?? "user",
      params.createdAt
    );
  }
}

function assertValidTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    throw new InvalidTimezoneError(timezone);
  }
}
