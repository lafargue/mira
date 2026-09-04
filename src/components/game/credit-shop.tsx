import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CREDIT_PACKS,
  formatEuro,
  packById,
  savePercent,
  unitCents,
  type BuyResult,
  type CreditPack,
  type PackId,
} from "@/lib/game/packs";
import { usePrefs } from "@/lib/prefs-context";
import { cn } from "@/lib/utils";

export function CreditShop({
  signedIn,
  busy,
  onBuy,
}: {
  signedIn: boolean;
  busy: boolean;
  onBuy: (packId: PackId) => Promise<BuyResult>;
}) {
  const { t, locale } = usePrefs();
  const [picked, setPicked] = useState<PackId | null>(null);
  const [result, setResult] = useState<BuyResult | null>(null);

  const pack = picked ? packById(picked) : null;
  const list = CREDIT_PACKS[0];

  const pay = async (id: PackId) => {
    if (!signedIn) return;
    const res = await onBuy(id);
    setResult(res);
  };

  if (result && pack) {
    const paid = result.ok && result.mode === "simulated";
    return (
      <section className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4" aria-live="polite">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">{t.gatewayTitle}</p>
        <h4 className="mt-2 font-display text-2xl tracking-tight">{paid ? t.paySimulated : t.paySoon}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {paid ? t.payAdded.replace("{n}", String(result.credits)) : t.paySoonBody}
        </p>
        {paid ? (
          <p className="mt-3 font-display text-3xl tabular-nums text-fg">{result.balance}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {pack.name} · {pack.credits} · {formatEuro(pack.priceCents, locale)}
          </p>
        )}
        <Button
          className="mt-4 w-full rounded-xl"
          variant="secondary"
          onClick={() => {
            setResult(null);
            setPicked(null);
          }}
        >
          {t.close}
        </Button>
      </section>
    );
  }

  if (pack) {
    return (
      <section className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">{t.gatewayTitle}</p>
        <h4 className="mt-2 font-display text-2xl tracking-tight">{pack.name}</h4>
        <p className="mt-1 text-sm text-muted">
          {pack.credits} {t.credits} · {formatEuro(pack.priceCents, locale)}
        </p>
        {!signedIn ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.shopNeedAccount}</p>
            <Button asChild className="mt-4 w-full rounded-xl">
              <Link to="/login">{t.enter}</Link>
            </Button>
          </>
        ) : (
          <Button className="mt-4 w-full rounded-xl" disabled={busy} onClick={() => void pay(pack.id)}>
            <CreditCard className="size-4" strokeWidth={1.75} />
            {t.pay.replace("{price}", formatEuro(pack.priceCents, locale))}
          </Button>
        )}
        <button
          type="button"
          className="mt-2 flex h-11 w-full items-center justify-center rounded-xl text-sm text-muted hover:text-fg"
          onClick={() => setPicked(null)}
        >
          {t.back}
        </button>
      </section>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {CREDIT_PACKS.map((p) => (
        <PackRow key={p.id} pack={p} list={list} locale={locale} onPick={() => setPicked(p.id)} />
      ))}
    </div>
  );
}

function PackRow({
  pack,
  list,
  locale,
  onPick,
}: {
  pack: CreditPack;
  list: CreditPack;
  locale: string;
  onPick: () => void;
}) {
  const { t } = usePrefs();
  const save = savePercent(pack, list);
  const unit = formatEuro(Math.round(unitCents(pack)), locale);
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex min-h-16 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50",
        pack.featured ? "border-fg bg-surface-2" : "border-border bg-surface hover:text-fg",
      )}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-display text-lg tracking-tight text-fg">{pack.name}</span>
          {pack.featured ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-muted uppercase">
              {t.packBest}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {pack.credits} {t.credits}
          {save > 0 ? ` · ${t.packSave.replace("{n}", String(save))}` : ""}
          {` · ${unit}${t.packUnit}`}
        </span>
      </span>
      <span className="shrink-0 font-display text-xl tabular-nums text-fg">
        {formatEuro(pack.priceCents, locale)}
      </span>
    </button>
  );
}
