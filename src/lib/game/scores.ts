import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type BoardRow = {
  handle: string;
  score: number;
  isYou: boolean;
};

export type BoardPayload = {
  rows: BoardRow[];
  myScore: number | null;
  myRank: number | null;
};

function publicHandle(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = Math.imul(31, h) + userId.charCodeAt(i) | 0;
  const n = Math.abs(h).toString(36).slice(0, 4).toUpperCase();
  return `Mira-${n}`;
}

const submitInput = z.object({
  mode: z.enum(["daily", "endless"]),
  score: z.number().int().min(0).max(1_000_000),
  dateKey: z.string().max(16),
  glyphs: z.array(z.number().int().min(0).max(4)).max(12),
});

export const submitScore = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => submitInput.parse(raw))
  .handler(async ({ context, data }) => {
    const dateKey = data.mode === "daily" ? data.dateKey : "";
    if (data.mode === "daily" && !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return { ok: false as const, score: 0 };
    }
    const handle = publicHandle(context.userId);
    const glyphs = JSON.stringify(data.glyphs);
    const sql = await getSql();
    await sql`
      insert into mira_scores (user_id, handle, mode, date_key, score, glyphs)
      values (${context.userId}, ${handle}, ${data.mode}, ${dateKey}, ${data.score}, ${glyphs})
      on conflict (user_id, mode, date_key)
      do update set
        handle = excluded.handle,
        score = greatest(mira_scores.score, excluded.score),
        glyphs = case when excluded.score >= mira_scores.score then excluded.glyphs else mira_scores.glyphs end,
        updated_at = now()
    `;
    const mine = await sql<{ score: number }>`
      select score from mira_scores
      where user_id = ${context.userId} and mode = ${data.mode} and date_key = ${dateKey}
    `;
    return { ok: true as const, score: mine[0]?.score ?? data.score };
  });

const boardInput = z.object({
  mode: z.enum(["daily", "endless"]),
  dateKey: z.string().max(16),
});

export const listBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => boardInput.parse(raw))
  .handler(async ({ context, data }): Promise<BoardPayload> => {
    const dateKey = data.mode === "daily" ? data.dateKey : "";
    const sql = await getSql();
    const mine = await sql<{ score: number }>`
      select score from mira_scores
      where user_id = ${context.userId} and mode = ${data.mode} and date_key = ${dateKey}
    `;
    const myScore = mine[0]?.score ?? null;
    let myRank: number | null = null;
    if (myScore !== null) {
      const rankRows = await sql<{ rank: number }>`
        select count(*)::int + 1 as rank from mira_scores
        where mode = ${data.mode} and date_key = ${dateKey} and score > ${myScore}
      `;
      myRank = rankRows[0]?.rank ?? 1;
    }
    const top = await sql<{ user_id: string; handle: string; score: number }>`
      select user_id, handle, score from mira_scores
      where mode = ${data.mode} and date_key = ${dateKey}
      order by score desc, updated_at asc
      limit 20
    `;
    return {
      rows: top.map((r) => ({
        handle: r.handle,
        score: r.score,
        isYou: r.user_id === context.userId,
      })),
      myScore,
      myRank,
    };
  });
