import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { buyPack, getWallet, spendCredit } from "@/lib/game/credits";
import { loadLocalWallet, spendLocal, type CreditSpend } from "@/lib/game/wallet";
import type { BuyResult, PackId } from "@/lib/game/packs";

export function useCredits() {
  const { user, isPending } = useCurrentUserState();
  const [balance, setBalance] = useState(() => loadLocalWallet().balance);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    if (userId) {
      try {
        const wallet = await getWallet();
        setBalance(wallet.balance);
      } catch {
        setBalance(loadLocalWallet().balance);
      }
    } else {
      setBalance(loadLocalWallet().balance);
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (isPending) return;
    void refresh();
  }, [isPending, refresh]);

  const spend = useCallback(
    async (reason: "tip"): Promise<CreditSpend> => {
      if (busy) return { ok: false, balance, reason: "unknown" };
      setBusy(true);
      try {
        if (user) {
          const res = await spendCredit({ data: { reason } });
          setBalance(res.balance);
          return res;
        }
        const res = spendLocal(reason);
        setBalance(res.balance);
        return res;
      } catch {
        return { ok: false, balance, reason: "unknown" };
      } finally {
        setBusy(false);
      }
    },
    [balance, busy, user],
  );

  const buy = useCallback(
    async (packId: PackId): Promise<BuyResult> => {
      if (!user) return { ok: false, reason: "signed-out", packId };
      if (busy) return { ok: false, reason: "unknown", packId };
      setBusy(true);
      try {
        const res = await buyPack({ data: { packId } });
        if (res.ok) setBalance(res.balance);
        return res;
      } catch {
        return { ok: false, reason: "unknown", packId };
      } finally {
        setBusy(false);
      }
    },
    [busy, user],
  );

  return { balance, ready, busy, spend, buy, signedIn: Boolean(user) };
}
