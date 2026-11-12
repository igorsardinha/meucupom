const DEFAULT_SUPER_ADMIN_EMAILS = ["igoreduardosardinha@gmail.com"];

export function getSuperAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) {
    return DEFAULT_SUPER_ADMIN_EMAILS;
  }
  const parsed = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_SUPER_ADMIN_EMAILS;
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getSuperAdminEmails().includes(normalized);
}
