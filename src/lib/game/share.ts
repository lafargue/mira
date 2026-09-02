import { DAILY_MOVES } from "./engine.ts";
import { dailyNumber } from "./rng.ts";

/** Intensity 0–4. Geometric, not emoji: they render on Android and match the share text. */
export const PULSE_GLYPHS = ["□", "■", "●", "▲", "♦"] as const;

export type GlyphGuide = {
  glyph: string;
  name: string;
  short: string;
  how: string;
};

export const GLYPH_GUIDE: GlyphGuide[] = [
  { glyph: "□", name: "Pulso", short: "Pulso", how: "Una ficha. El toque más flojo." },
  { glyph: "■", name: "Eco", short: "Eco", how: "Dos en cruz." },
  { glyph: "●", name: "Acorde o Halo", short: "3 o 4", how: "Tres o cuatro." },
  { glyph: "▲", name: "Iris", short: "Iris", how: "Cinco. El toque más gordo." },
  { glyph: "♦", name: "Mira", short: "Mira", how: "Estallido al caer." },
];

export function glyphChar(n: number): string {
  return PULSE_GLYPHS[Math.max(0, Math.min(4, n))] ?? "□";
}

export function renderGlyphRow(glyphs: number[]): string {
  const cells = glyphs.slice(0, DAILY_MOVES).map(glyphChar);
  const a = cells.slice(0, 6).join("");
  const b = cells.slice(6, 12).join("");
  return b ? `${a}\n${b}` : a;
}

export function renderGlyphGrid(glyphs: number[]): string {
  const cells = glyphs.slice(0, DAILY_MOVES).map(glyphChar);
  const a = cells.slice(0, 6).join(" ");
  const b = cells.slice(6, 12).join(" ");
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
