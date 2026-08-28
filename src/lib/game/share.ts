import { DAILY_MOVES } from "./engine.ts";
import { dailyNumber } from "./rng.ts";

const GLYPHS = ["⬛", "⬜", "🟦", "🟩", "🟪"] as const;

export function renderGlyphRow(glyphs: number[]): string {
  const cells = glyphs.slice(0, DAILY_MOVES).map((g) => GLYPHS[Math.max(0, Math.min(4, g))] ?? "⬛");
  const a = cells.slice(0, 6).join("");
  const b = cells.slice(6, 12).join("");
  return b ? `${a}\n${b}` : a;
}

export function shareUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/`;
}

export function shareText(opts: {
  dateKey: string;
  score: number;
  glyphs: number[];
  streak: number;
}): string {
  const n = dailyNumber(opts.dateKey);
  const grid = renderGlyphRow(opts.glyphs);
  const streak = opts.streak > 1 ? ` · racha ${opts.streak}` : "";
  const url = shareUrl();
  const link = url ? `\n${url}` : "";
  return `MIRA #${n}\n${opts.score.toLocaleString("es")} pts${streak}\n\n${grid}${link}`;
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
