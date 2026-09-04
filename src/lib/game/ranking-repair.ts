import { isOwnerEmail } from "./wallet.ts";

/** Clean daily that was deleted when a later Tip run opened the ranking. */
export const OWNER_CLEAN_DAILY: Record<string, number> = {
  "2026-09-04": 13760,
};

export function ownerCleanRepair(
  email: string | null | undefined,
  dateKey: string,
  existingClean: number | null | undefined,
): number | null {
  if (!isOwnerEmail(email)) return null;
  const want = OWNER_CLEAN_DAILY[dateKey];
  if (!want) return null;
  if ((existingClean ?? 0) > 0) return null;
  return want;
}
