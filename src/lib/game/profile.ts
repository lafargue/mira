import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { HANDLE_MAX, parseHandle, slugFromName, suggestHandles } from "@/lib/game/handle";

export type SetHandleResult =
  | { ok: true; handle: string; unchanged?: boolean }
  | { ok: false; reason: "invalid" | "reserved" | "taken"; suggestions: string[] };

const handleInput = z.object({
  handle: z.string().max(HANDLE_MAX + 8),
});

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return e.code === "23505" || /unique|duplicate/i.test(e.message ?? "");
}

async function takenSet(desired: string, userId: string): Promise<Set<string>> {
  const sql = await getSql();
  const pool = suggestHandles(desired, new Set(), 12);
  if (pool.length === 0) return new Set();
  const rows = await sql.query<{ handle_lc: string }>(
    `select handle_lc from mira_profiles where handle_lc = any($1::text[]) and user_id <> $2`,
    [pool.map((h) => h.toLowerCase()), userId],
  );
  return new Set(rows.map((r) => r.handle_lc));
}

async function alternatives(desired: string, userId: string): Promise<string[]> {
  const taken = await takenSet(desired, userId);
  return suggestHandles(desired, taken, 3);
}

async function nameFor(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql<{ name: string | null }>`
    select "name" as name from "user" where id = ${userId} limit 1
  `;
  return rows[0]?.name ?? "";
}

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ handle: string }>`
      select handle from mira_profiles where user_id = ${context.userId} limit 1
    `;
    return {
      handle: rows[0]?.handle ?? null,
      suggested: slugFromName(await nameFor(context.userId)),
    };
  });

export const checkHandle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => handleInput.parse(raw))
  .handler(async ({ context, data }): Promise<SetHandleResult> => {
    const parsed = parseHandle(data.handle);
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason, suggestions: await alternatives(data.handle, context.userId) };
    }
    const sql = await getSql();
    const mine = await sql<{ handle: string; handle_lc: string }>`
      select handle, handle_lc from mira_profiles where user_id = ${context.userId} limit 1
    `;
    if (mine[0]?.handle_lc === parsed.lc) {
      return { ok: true, handle: mine[0].handle, unchanged: true };
    }
    const clash = await sql<{ user_id: string }>`
      select user_id from mira_profiles where handle_lc = ${parsed.lc} limit 1
    `;
    if (clash[0]) {
      return { ok: false, reason: "taken", suggestions: await alternatives(parsed.display, context.userId) };
    }
    return { ok: true, handle: parsed.display };
  });

export const setHandle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => handleInput.parse(raw))
  .handler(async ({ context, data }): Promise<SetHandleResult> => {
    const parsed = parseHandle(data.handle);
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason, suggestions: await alternatives(data.handle, context.userId) };
    }
    const sql = await getSql();
    const mine = await sql<{ handle: string; handle_lc: string }>`
      select handle, handle_lc from mira_profiles where user_id = ${context.userId} limit 1
    `;
    if (mine[0]?.handle_lc === parsed.lc) {
      return { ok: true, handle: mine[0].handle, unchanged: true };
    }
    const clash = await sql<{ user_id: string }>`
      select user_id from mira_profiles where handle_lc = ${parsed.lc} limit 1
    `;
    if (clash[0]) {
      return { ok: false, reason: "taken", suggestions: await alternatives(parsed.display, context.userId) };
    }
    try {
      await sql`
        insert into mira_profiles (user_id, handle, handle_lc)
        values (${context.userId}, ${parsed.display}, ${parsed.lc})
        on conflict (user_id) do update set
          handle = excluded.handle,
          handle_lc = excluded.handle_lc,
          updated_at = now()
      `;
    } catch (err) {
      if (isUniqueViolation(err)) {
        return { ok: false, reason: "taken", suggestions: await alternatives(parsed.display, context.userId) };
      }
      throw err;
    }
    await sql`
      update mira_scores set handle = ${parsed.display} where user_id = ${context.userId}
    `;
    return { ok: true, handle: parsed.display };
  });
