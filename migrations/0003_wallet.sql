-- Per-account credit wallet and a simple ledger.
-- No payments yet. First touch of the wallet grants a test balance.
create table if not exists mira_wallet (
  user_id     text primary key,
  balance     integer not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists mira_ledger (
  id          serial primary key,
  user_id     text not null,
  amount      integer not null,
  reason      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists mira_ledger_user_idx
  on mira_ledger (user_id, created_at desc);
