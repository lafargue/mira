/**
 * Credit packs. Prices in euro cents (Apple/Play style tiers).
 *
 * A Tip costs 1 credit. A daily is 12 pulses; one or two Tips is a helped day.
 * Sticker price is the small pack: ~0,20 € per credit.
 *
 * Halo is the pack that pays off: 5× the credits of Pulso for 3× the money.
 * Mira is a stash — barely cheaper per credit, so Halo stays the rational buy.
 */
export const PACK_IDS = ["pulso", "halo", "mira"] as const;
export type PackId = (typeof PACK_IDS)[number];

export type CreditPack = {
  id: PackId;
  name: string;
  credits: number;
  priceCents: number;
  featured: boolean;
};

export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "pulso", name: "Pulso", credits: 5, priceCents: 99, featured: false },
  { id: "halo", name: "Halo", credits: 25, priceCents: 299, featured: true },
  { id: "mira", name: "Mira", credits: 70, priceCents: 799, featured: false },
];

export function packById(id: string): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null;
}

export function unitCents(pack: CreditPack): number {
  return pack.priceCents / pack.credits;
}

/** Discount vs the small pack's unit price, 0–100. */
export function savePercent(pack: CreditPack, list = CREDIT_PACKS[0]): number {
  const from = unitCents(list);
  if (from <= 0) return 0;
  return Math.max(0, Math.round((1 - unitCents(pack) / from) * 100));
}

export function formatEuro(cents: number, locale: string): string {
  const tag =
    locale === "en" ? "en-IE" : locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "es-ES";
  return (cents / 100).toLocaleString(tag, { style: "currency", currency: "EUR" });
}

export type BuyResult =
  | { ok: true; mode: "simulated"; packId: PackId; credits: number; balance: number }
  | { ok: false; reason: "checkout" | "signed-out" | "unknown"; packId?: PackId };
