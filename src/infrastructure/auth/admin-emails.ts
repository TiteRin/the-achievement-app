function configuredAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isConfiguredAdminEmail(email: string): boolean {
  return configuredAdminEmails().has(email.trim().toLowerCase());
}
