export const STARTING_CREDITS = 5;
export const TIP_COST = 1;
/** Test refill applies only to this signed-in account. */
export const OWNER_EMAIL = "jaime32@gmail.com";

export const CREDIT_REASONS = ["grant", "tip", "refill", "purchase"] as const;
export type CreditReason = (typeof CREDIT_REASONS)[number];

export type CreditSpend = {
  ok: boolean;
  balance: number;
  reason?: "empty" | "unknown";
};

const LOCAL_KEY = "mira-wallet-v1";

export type LocalWallet = {
  version: 1;
  balance: number;
  granted: boolean;
  ledger: Array<{ amount: number; reason: CreditReason; at: string }>;
};

export function isOwnerEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === OWNER_EMAIL;
}

function emptyLocal(): LocalWallet {
  return { version: 1, balance: 0, granted: false, ledger: [] };
}

function canStore(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function loadLocalWallet(): LocalWallet {
  const fresh = emptyLocal();
  if (!canStore()) return grantLocal(fresh);
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return persistLocal(grantLocal(fresh));
    const parsed = JSON.parse(raw) as Partial<LocalWallet>;
    const wallet: LocalWallet = {
      version: 1,
      balance: typeof parsed.balance === "number" && parsed.balance >= 0 ? parsed.balance : 0,
      granted: Boolean(parsed.granted),
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
    };
    if (!wallet.granted) return persistLocal(grantLocal(wallet));
    return wallet;
  } catch {
    return persistLocal(grantLocal(fresh));
  }
}

function grantLocal(wallet: LocalWallet): LocalWallet {
  if (wallet.granted) return wallet;
  return {
    ...wallet,
    granted: true,
    balance: wallet.balance + STARTING_CREDITS,
    ledger: [
      ...wallet.ledger,
      { amount: STARTING_CREDITS, reason: "grant", at: new Date().toISOString() },
    ],
  };
}

function persistLocal(wallet: LocalWallet): LocalWallet {
  if (!canStore()) return wallet;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(wallet));
  } catch {
    /* private mode / quota */
  }
  return wallet;
}

export function spendLocal(reason: Exclude<CreditReason, "grant">, cost = TIP_COST): CreditSpend {
  const wallet = loadLocalWallet();
  if (wallet.balance < cost) return { ok: false, balance: wallet.balance, reason: "empty" };
  const next: LocalWallet = {
    ...wallet,
    balance: wallet.balance - cost,
    ledger: [...wallet.ledger, { amount: -cost, reason, at: new Date().toISOString() }],
  };
  persistLocal(next);
  return { ok: true, balance: next.balance };
}

export function costFor(reason: CreditReason): number {
  if (reason === "tip") return TIP_COST;
  return 0;
}
