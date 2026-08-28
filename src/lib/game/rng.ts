/** Mulberry32 — tiny, serializable, deterministic. */
export type Rng = {
  next: () => number;
  getState: () => number;
  color: () => 0 | 1 | 2;
};

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    getState: () => a >>> 0,
    color: () => Math.floor(next() * 3) as 0 | 1 | 2,
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function utcDateKey(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Mira #1 = 2026-08-28 UTC. */
const EPOCH = Date.UTC(2026, 7, 28);

export function dailyNumber(dateKey: string): number {
  const [y, m, day] = dateKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, day);
  return Math.floor((t - EPOCH) / 86400000) + 1;
}

export function dailySeed(dateKey: string): number {
  return hashString(`mira-${dateKey}`);
}
