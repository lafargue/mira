import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { STARTING_CREDITS, TIP_COST, isOwnerEmail, type CreditSpend } from "@/lib/game/wallet";

const spendInput = z.object({
  reason: z.enum(["tip"]),
});

async function ensureWallet(userId: string): Promise<number> {
  const sql = await getSql();
  const existing = await sql<{ balance: number }>`
    select balance from mira_wallet where user_id = ${userId} limit 1
  `;
  if (existing[0]) return refillOwnerIfNeeded(userId, existing[0].balance);

  await sql`
    insert into mira_wallet (user_id, balance)
    values (${userId}, ${STARTING_CREDITS})
    on conflict (user_id) do nothing
  `;
  const granted = await sql<{ n: number }>`
    select count(*)::int as n from mira_ledger
    where user_id = ${userId} and reason = 'grant'
  `;
  if ((granted[0]?.n ?? 0) === 0) {
    await sql`
      insert into mira_ledger (user_id, amount, reason)
      values (${userId}, ${STARTING_CREDITS}, 'grant')
    `;
  }
  const row = await sql<{ balance: number }>`
    select balance from mira_wallet where user_id = ${userId} limit 1
  `;
  const balance = row[0]?.balance ?? STARTING_CREDITS;
  return refillOwnerIfNeeded(userId, balance);
}

async function refillOwnerIfNeeded(userId: string, balance: number): Promise<number> {
  const sql = await getSql();
  const owner = await sql<{ email: string | null }>`
    select email from "user" where id = ${userId} limit 1
  `;
  if (!isOwnerEmail(owner[0]?.email)) return balance;

  const already = await sql<{ n: number }>`
    select count(*)::int as n from mira_ledger
    where user_id = ${userId} and reason = 'refill'
  `;
  if ((already[0]?.n ?? 0) > 0) return balance;

  const next = Math.max(balance, STARTING_CREDITS);
  const delta = next - balance;
  if (delta > 0) {
    await sql`
      update mira_wallet
      set balance = ${next}, updated_at = now()
      where user_id = ${userId}
    `;
  }
  await sql`
    insert into mira_ledger (user_id, amount, reason)
    values (${userId}, ${delta}, 'refill')
  `;
  return next;
}

export const getWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const balance = await ensureWallet(context.userId);
    return { balance };
  });

export const spendCredit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => spendInput.parse(raw))
  .handler(async ({ context, data }): Promise<CreditSpend> => {
    const cost = data.reason === "tip" ? TIP_COST : 0;
    if (cost <= 0) return { ok: false, balance: 0, reason: "unknown" };
    await ensureWallet(context.userId);
    const sql = await getSql();
    const updated = await sql<{ balance: number }>`
      update mira_wallet
      set balance = balance - ${cost}, updated_at = now()
      where user_id = ${context.userId} and balance >= ${cost}
      returning balance
    `;
    if (!updated[0]) {
      const now = await sql<{ balance: number }>`
        select balance from mira_wallet where user_id = ${context.userId} limit 1
      `;
      return { ok: false, balance: now[0]?.balance ?? 0, reason: "empty" };
    }
    await sql`
      insert into mira_ledger (user_id, amount, reason)
      values (${context.userId}, ${-cost}, ${data.reason})
    `;
    return { ok: true, balance: updated[0].balance };
  });
