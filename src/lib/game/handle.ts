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

const HANDLE_RE = new RegExp(`^[A-Za-z][A-Za-z0-9_-]{${HANDLE_MIN - 1},${HANDLE_MAX - 1}}$`);

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
  if (!HANDLE_RE.test(display)) return { ok: false, reason: "invalid" };
  const lc = display.toLowerCase();
  if (RESERVED_HANDLES.has(lc)) return { ok: false, reason: "reserved" };
  return { ok: true, display, lc };
}

/** First-login seed from the Google/X display name. Never returns a reserved word. */
export function slugFromName(name: string): string {
  const words = foldHandle(name)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let stem = words[0] ?? "";
  if (stem.length < HANDLE_MIN) stem = words.join("");
  stem = stem.replace(/[^a-z0-9]/g, "");
  if (!/^[a-z]/.test(stem)) stem = `m${stem}`;
  stem = stem.slice(0, HANDLE_MAX);
  if (stem.length < HANDLE_MIN) stem = (stem + "player").slice(0, HANDLE_MAX);
  if (RESERVED_HANDLES.has(stem)) stem = `${stem}1`.slice(0, HANDLE_MAX);
  const parsed = parseHandle(stem);
  return parsed.ok ? parsed.display : "player";
}

function pushCandidate(out: string[], raw: string, skip: Set<string>) {
  const parsed = parseHandle(raw);
  if (!parsed.ok) return;
  if (skip.has(parsed.lc)) return;
  skip.add(parsed.lc);
  out.push(parsed.display);
}

/** Up to `limit` alternatives. `taken` is lowercase. */
export function suggestHandles(desired: string, taken: Set<string>, limit = 3): string[] {
  const skip = new Set(taken);
  const stem = slugFromName(desired);
  const short = stem.slice(0, Math.max(HANDLE_MIN, HANDLE_MAX - 3));
  const out: string[] = [];
  const extras = [`${stem}2`, `${stem}3`, `${short}_mira`, `${short}_halo`, `${stem}11`, `${stem}21`, `${short}7`];
  for (const c of extras) {
    if (out.length >= limit) break;
    pushCandidate(out, c.slice(0, HANDLE_MAX), skip);
  }
  for (let n = 4; n <= 99 && out.length < limit; n += 1) {
    pushCandidate(out, `${short}${n}`.slice(0, HANDLE_MAX), skip);
  }
  return out.slice(0, limit);
}
