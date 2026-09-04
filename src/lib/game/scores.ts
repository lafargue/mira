import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { publicHandle } from "@/lib/game/handle";
import { fallbackHandle, displayHandle } from "@/lib/game/ranking-view";
import { ownerCleanRepair } from "@/lib/game/ranking-repair";

export type BoardRow = {
  handle: string;
  score: number;
  isYou: boolean;
};

export type BoardPayload = {
  rows: BoardRow[];
  myScore: number | null;
  myRank: number | null;
  total: number;
};

/** Forward the preview bearer if present; do not require a session (public ranking). */
const optionalSession = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    let userId: string | null = null;
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser(context.bearerToken);
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }
    return next({ context: { userId } });
  });

const submitInput = z.object({
  mode: z.enum(["daily", "endless"]),
  score: z.number().int().min(0).max(1_000_000),
  dateKey: z.string().max(16),
  glyphs: z.array(z.number().int().min(0).max(4)).max(12),
  helped: z.boolean().optional(),
});

async function handleFor(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql<{ handle: string | null }>`
    select handle from mira_profiles where user_id = ${userId} limit 1
  `;
  const claimed = publicHandle(rows[0]?.handle ?? null);
  if (claimed) return claimed;
  const named = await sql<{ name: string | null }>`
    select "name" as name from "user" where id = ${userId} limit 1
  `;
  const fromGoogle = (named[0]?.name ?? "").trim();
  if (fromGoogle) return fromGoogle;
  return fallbackHandle(userId);
}

async function emailFor(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ email: string | null }>`
    select email from "user" where id = ${userId} limit 1
  `;
  return rows[0]?.email ?? null;
}

async function repairOwnerDaily(userId: string, dateKey: string): Promise<void> {
  const sql = await getSql();
  const existing = await sql<{ score: number }>`
    select score from mira_scores
    where user_id = ${userId} and mode = 'daily' and date_key = ${dateKey} and not helped
    limit 1
  `;
  const want = ownerCleanRepair(await emailFor(userId), dateKey, existing[0]?.score ?? null);
  if (!want) return;
  const handle = await handleFor(userId);
  await sql`
    insert into mira_scores (user_id, handle, mode, date_key, score, glyphs, helped)
    values (${userId}, ${handle}, 'daily', ${dateKey}, ${want}, '[]', false)
    on conflict (user_id, mode, date_key)
    do update set
      handle = excluded.handle,
      score = excluded.score,
      glyphs = excluded.glyphs,
      helped = false,
      updated_at = now()
  `;
}

export const submitScore = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => submitInput.parse(raw))
  .handler(async ({ context, data }) => {
    const dateKey = data.mode === "daily" ? data.dateKey : "";
    if (data.mode === "daily" && !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return { ok: false as const, score: 0 };
    }
    if (data.mode === "daily" && data.helped) {
      return { ok: false as const, score: 0, skipped: "helped" as const };
    }
    const handle = await handleFor(context.userId);
    const glyphs = JSON.stringify(data.glyphs);
    const sql = await getSql();
    await sql`
      insert into mira_scores (user_id, handle, mode, date_key, score, glyphs, helped)
      values (${context.userId}, ${handle}, ${data.mode}, ${dateKey}, ${data.score}, ${glyphs}, false)
      on conflict (user_id, mode, date_key)
      do update set
        handle = excluded.handle,
        score = case
          when mira_scores.helped then excluded.score
          else greatest(mira_scores.score, excluded.score)
        end,
        glyphs = case
          when mira_scores.helped then excluded.glyphs
          when excluded.score >= mira_scores.score then excluded.glyphs
          else mira_scores.glyphs
        end,
        helped = false,
        updated_at = now()
    `;
    const mine = await sql<{ score: number }>`
      select score from mira_scores
      where user_id = ${context.userId} and mode = ${data.mode} and date_key = ${dateKey}
    `;
    return { ok: true as const, score: mine[0]?.score ?? data.score };
  });

/** Daily + Tip: pull this account's mark off today's board. */
export const withdrawHelpedDaily = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) =>
    z.object({ dateKey: z.string().max(16), helped: z.literal(true) }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateKey)) return { ok: false as const };
    const sql = await getSql();
    await sql`
      delete from mira_scores
      where user_id = ${context.userId}
        and mode = 'daily'
        and date_key = ${data.dateKey}
        and helped = true
    `;
    return { ok: true as const };
  });

const boardInput = z.object({
  mode: z.enum(["daily", "endless"]),
  dateKey: z.string().max(16),
});

export const listBoard = createServerFn({ method: "POST" })
  .middleware([optionalSession])
  .validator((raw: unknown) => boardInput.parse(raw))
  .handler(async ({ context, data }): Promise<BoardPayload> => {
    const dateKey = data.mode === "daily" ? data.dateKey : "";
    const userId = context.userId;
    const sql = await getSql();
    if (userId && data.mode === "daily" && dateKey) {
      await repairOwnerDaily(userId, dateKey);
    }
    let myScore: number | null = null;
    let myRank: number | null = null;
    if (userId) {
      const mine = await sql<{ score: number }>`
        select score from mira_scores
        where user_id = ${userId} and mode = ${data.mode} and date_key = ${dateKey} and not helped
      `;
      myScore = mine[0]?.score ?? null;
      if (myScore !== null) {
        const rankRows = await sql<{ rank: number }>`
          select count(*)::int + 1 as rank from mira_scores
          where mode = ${data.mode} and date_key = ${dateKey} and not helped and score > ${myScore}
        `;
        myRank = rankRows[0]?.rank ?? 1;
      }
    }
    const counted = await sql<{ n: number }>`
      select count(*)::int as n from mira_scores
      where mode = ${data.mode} and date_key = ${dateKey} and not helped
    `;
    const total = counted[0]?.n ?? 0;
    const top = await sql<{ user_id: string; handle: string; score: number; profile_handle: string | null }>`
      select s.user_id, s.handle, s.score, p.handle as profile_handle
      from mira_scores s
      left join mira_profiles p on p.user_id = s.user_id
      where s.mode = ${data.mode} and s.date_key = ${dateKey} and not s.helped
      order by s.score desc, s.updated_at asc
      limit 20
    `;
    return {
      rows: top.map((r) => ({
        handle: displayHandle(r.profile_handle, r.user_id, r.handle),
        score: r.score,
        isYou: Boolean(userId) && r.user_id === userId,
      })),
      myScore,
      myRank,
      total,
    };
  });
