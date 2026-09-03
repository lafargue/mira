import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getWallet, spendCredit } from "@/lib/game/credits";
import { loadLocalWallet, spendLocal, type CreditSpend } from "@/lib/game/wallet";

export function useCredits() {
  const { user, isPending } = useCurrentUserState();
  const [balance, setBalance] = useState(() => loadLocalWallet().balance);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (user) {
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
  }, [user]);

  useEffect(() => {
    if (isPending) {
      setBalance(loadLocalWallet().balance);
      return;
    }
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

  return { balance, ready, busy, spend, signedIn: Boolean(user) };
}
