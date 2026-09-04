export const HANDLE_MIN = 3;
export const HANDLE_MAX = 16;

export const RESERVED_HANDLES = new Set([
  "admin",
  "anon",
  "anonymous",
  "bot",
  "daily",
  "diario",
  "endless",
  "guest",
  "help",
  "local",
  "login",
  "me",
  "mira",
  "mod",
  "moderator",
  "null",
  "official",
  "owner",
  "player",
  "ranking",
  "root",
  "settings",
  "staff",
  "support",
  "system",
  "test",
  "tu",
  "undefined",
  "user",
  "yo",
  "you",
]);

const HANDLE_RE = new RegExp(`^[\\p{L}][\\p{L}\\p{N}_-]{${HANDLE_MIN - 1},${HANDLE_MAX - 1}}$`, "u");

export type HandleReason = "invalid" | "reserved" | "taken";

export type ParsedHandle =
  | { ok: true; display: string; lc: string }
  | { ok: false; reason: "invalid" | "reserved" };

export function foldHandle(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function parseHandle(raw: string): ParsedHandle {
  const display = raw.trim();
  if (display.length < HANDLE_MIN || display.length > HANDLE_MAX) {
    return { ok: false, reason: "invalid" };
  }
  if (!HANDLE_RE.test(display)) return { ok: false, reason: "invalid" };
  const lc = foldHandle(display);
  if (lc.length < HANDLE_MIN || !/^[a-z]/.test(lc)) return { ok: false, reason: "invalid" };
  if (RESERVED_HANDLES.has(lc)) return { ok: false, reason: "reserved" };
  return { ok: true, display, lc };
}

/** True only for a claimed public alias — never a Google full name. */
export function isPublicHandle(raw: string | null | undefined): boolean {
  return parseHandle(raw ?? "").ok;
}

export function publicHandle(raw: string | null | undefined): string | null {
  const parsed = parseHandle(raw ?? "");
  return parsed.ok ? parsed.display : null;
}

function nameWords(name: string): string[] {
  return foldHandle(name)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function clipStem(stem: string): string {
  let out = stem.replace(/[^a-z0-9]/g, "");
  if (!/^[a-z]/.test(out)) out = `m${out}`;
  out = out.slice(0, HANDLE_MAX);
  if (out.length < HANDLE_MIN) out = (out + "player").slice(0, HANDLE_MAX);
  if (RESERVED_HANDLES.has(out)) out = `${out}1`.slice(0, HANDLE_MAX);
  return out;
}

/** First-login seed from the Google/X display name. Never a reserved word. */
export function slugFromName(name: string): string {
  const words = nameWords(name);
  let stem = words[0] ?? "";
  if (stem.length < HANDLE_MIN) stem = words.join("");
  const parsed = parseHandle(clipStem(stem));
  return parsed.ok ? parsed.display : "player";
}

function pushCandidate(out: string[], raw: string, skip: Set<string>) {
  const parsed = parseHandle(raw);
  if (!parsed.ok) return;
  if (skip.has(parsed.lc)) return;
  skip.add(parsed.lc);
  out.push(parsed.display);
}

/**
 * Up to `limit` alternatives. `taken` is lowercase/folded.
 * `fullName` (Google name) seeds first+last combos so suggestions feel personal.
 */
export function suggestHandles(
  desired: string,
  taken: Set<string>,
  limit = 3,
  fullName = "",
): string[] {
  const skip = new Set<string>();
  for (const t of taken) skip.add(foldHandle(t));
  const wanted = parseHandle(desired);
  if (wanted.ok) skip.add(wanted.lc);

  const stem = slugFromName(desired);
  const words = nameWords(fullName || desired);
  const first = words[0] ?? stem;
  const last = words.length > 1 ? words[words.length - 1] : "";
  const short = stem.slice(0, Math.max(HANDLE_MIN, HANDLE_MAX - 4));

  const extras = [
    last.length >= HANDLE_MIN ? last : "",
    ...words.slice(1).filter((w) => w.length >= HANDLE_MIN && w !== last),
    first && last ? `${first[0]}${last}` : "",
    first && last ? `${first}_${last[0]}` : "",
    first && last ? `${first}${last.slice(0, 4)}` : "",
    `${stem}2`,
    `${stem}3`,
    `${short}_mira`,
    `${short}_halo`,
    last ? `${last}2` : "",
    `${stem}7`,
    `${stem}11`,
    `${stem}21`,
    `${stem}32`,
    `${short}99`,
  ];

  const out: string[] = [];
  for (const c of extras) {
    if (out.length >= limit) break;
    if (!c) continue;
    pushCandidate(out, c.slice(0, HANDLE_MAX), skip);
  }
  for (let n = 4; n <= 99 && out.length < limit; n += 1) {
    pushCandidate(out, `${short}${n}`.slice(0, HANDLE_MAX), skip);
  }
  return out.slice(0, limit);
}

/** Seed the first-login field with a free handle and up to 3 backups. */
export function nextFreeHandle(
  desired: string,
  taken: Set<string>,
  fullName = "",
): { seed: string; suggestions: string[] } {
  const skip = new Set<string>();
  for (const t of taken) skip.add(foldHandle(t));
  const parsed = parseHandle(desired);
  const pool = suggestHandles(desired || fullName, skip, 4, fullName);
  if (parsed.ok && !skip.has(parsed.lc)) {
    return { seed: parsed.display, suggestions: pool.slice(0, 3) };
  }
  const seed = pool[0] ?? slugFromName(fullName || desired);
  const seedLc = foldHandle(seed);
  return {
    seed,
    suggestions: pool.filter((h) => foldHandle(h) !== seedLc).slice(0, 3),
  };
}
