import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  HANDLE_MAX,
  foldHandle,
  parseHandle,
  publicHandle,
  slugFromName,
  suggestHandles,
} from "@/lib/game/handle";

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

async function nameFor(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql<{ name: string | null }>`
    select "name" as name from "user" where id = ${userId} limit 1
  `;
  return rows[0]?.name ?? "";
}

async function takenSet(desired: string, userId: string, seedName: string): Promise<Set<string>> {
  const sql = await getSql();
  const parsed = parseHandle(desired);
  const stem = parsed.ok ? parsed.lc : slugFromName(desired || seedName);
  const prefix = stem.slice(0, Math.min(Math.max(stem.length, 1), 10));
  const rows = await sql<{ handle_lc: string }>`
    select handle_lc from mira_profiles
    where user_id <> ${userId}
      and (
        handle_lc like ${`${prefix}%`}
        or handle_lc = ${foldHandle(desired)}
      )
    limit 80
  `;
  return new Set(rows.map((r) => r.handle_lc));
}

async function alternatives(desired: string, userId: string, seedName?: string): Promise<string[]> {
  const name = seedName ?? (await nameFor(userId));
  const taken = await takenSet(desired, userId, name);
  return suggestHandles(desired || name, taken, 3, name);
}

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ handle: string }>`
      select handle from mira_profiles where user_id = ${context.userId} limit 1
    `;
    const name = await nameFor(context.userId);
    return {
      handle: publicHandle(rows[0]?.handle ?? null),
      suggested: slugFromName(name),
      fullName: name,
    };
  });

export const checkHandle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => handleInput.parse(raw))
  .handler(async ({ context, data }): Promise<SetHandleResult> => {
    const name = await nameFor(context.userId);
    const parsed = parseHandle(data.handle);
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason, suggestions: await alternatives(data.handle, context.userId, name) };
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
      return { ok: false, reason: "taken", suggestions: await alternatives(parsed.display, context.userId, name) };
    }
    return { ok: true, handle: parsed.display };
  });

export const setHandle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => handleInput.parse(raw))
  .handler(async ({ context, data }): Promise<SetHandleResult> => {
    const name = await nameFor(context.userId);
    const parsed = parseHandle(data.handle);
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason, suggestions: await alternatives(data.handle, context.userId, name) };
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
      return { ok: false, reason: "taken", suggestions: await alternatives(parsed.display, context.userId, name) };
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
        return { ok: false, reason: "taken", suggestions: await alternatives(parsed.display, context.userId, name) };
      }
      throw err;
    }
    await sql`
      update mira_scores set handle = ${parsed.display} where user_id = ${context.userId}
    `;
    return { ok: true, handle: parsed.display };
  });
