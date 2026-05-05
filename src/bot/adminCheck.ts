const rawAdminIds = process.env["TELEGRAM_ADMIN_IDS"] ?? "";

export const ADMIN_IDS: number[] = rawAdminIds
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number)
  .filter((n) => !isNaN(n));

export function isAdmin(userId: number): boolean {
  return ADMIN_IDS.includes(userId);
}
