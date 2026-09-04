import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { STARTING_CREDITS, TIP_COST, isOwnerEmail, mergedBalance, type CreditSpend } from "@/lib/game/wallet";
import { packById, PACK_IDS, type BuyResult } from "@/lib/game/packs";

const spendInput = z.object({
  reason: z.enum(["tip"]),
});

async function idsForEmail(email: string | null, fallbackId: string): Promise<string[]> {
  if (!email) return [fallbackId];
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select id from "user" where lower(trim(email)) = ${email.trim().toLowerCase()}
  `;
  return [...new Set([fallbackId, ...rows.map((r) => r.id)])];
}

async function ensureWallet(userId: string): Promise<number> {
  const sql = await getSql();
  const email = await emailFor(userId);
  const ids = await idsForEmail(email, userId);
  const wallets: Array<{ userId: string; balance: number }> = [];
  for (const id of ids) {
    const row = await sql<{ balance: number }>`
      select balance from mira_wallet where user_id = ${id} limit 1
    `;
    if (row[0]) wallets.push({ userId: id, balance: row[0].balance });
    const led = await sql<{ t: number }>`
      select coalesce(sum(amount), 0)::int as t from mira_ledger where user_id = ${id}
    `;
    if (typeof led[0]?.t === "number") wallets.push({ userId: id, balance: Math.max(0, led[0].t) });
  }
  let balance = mergedBalance(userId, wallets);
  const firstTouch = wallets.length === 0;
  if (firstTouch) balance = STARTING_CREDITS;

  await sql`
    insert into mira_wallet (user_id, balance)
    values (${userId}, ${balance})
    on conflict (user_id) do update set
      balance = greatest(mira_wallet.balance, excluded.balance),
      updated_at = now()
  `;
  if (firstTouch) {
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
  }
  const row = await sql<{ balance: number }>`
    select balance from mira_wallet where user_id = ${userId} limit 1
  `;
  const now = row[0]?.balance ?? balance;
  return refillOwnerIfNeeded(userId, now, email);
}

async function emailFor(userId: string): Promise<string | null> {
  const sql = await getSql();
  const owner = await sql<{ email: string | null }>`
    select email from "user" where id = ${userId} limit 1
  `;
  return owner[0]?.email ?? null;
}

async function refillOwnerIfNeeded(userId: string, balance: number, email?: string | null): Promise<number> {
  const mail = email === undefined ? await emailFor(userId) : email;
  if (!isOwnerEmail(mail)) return balance;
  const sql = await getSql();

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

const buyInput = z.object({
  packId: z.enum(PACK_IDS),
});

/**
 * Start a pack purchase.
 * Owner account simulates a successful payment (no card).
 * Everyone else is sent to the checkout stub — the real gateway is not wired yet.
 */
export const buyPack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => buyInput.parse(raw))
  .handler(async ({ context, data }): Promise<BuyResult> => {
    const pack = packById(data.packId);
    if (!pack) return { ok: false, reason: "unknown", packId: data.packId };
    await ensureWallet(context.userId);
    if (!isOwnerEmail(await emailFor(context.userId))) {
      return { ok: false, reason: "checkout", packId: pack.id };
    }
    const sql = await getSql();
    const updated = await sql<{ balance: number }>`
      update mira_wallet
      set balance = balance + ${pack.credits}, updated_at = now()
      where user_id = ${context.userId}
      returning balance
    `;
    if (!updated[0]) return { ok: false, reason: "unknown", packId: pack.id };
    await sql`
      insert into mira_ledger (user_id, amount, reason)
      values (${context.userId}, ${pack.credits}, 'purchase')
    `;
    return {
      ok: true,
      mode: "simulated",
      packId: pack.id,
      credits: pack.credits,
      balance: updated[0].balance,
    };
  });
