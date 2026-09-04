-- Public handle, unique per account. Google/X full names stay on "user"
-- and never appear on the ranking.
create table if not exists mira_profiles (
  user_id    text primary key,
  handle     text not null,
  handle_lc  text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (handle_lc)
);

create index if not exists mira_profiles_handle_lc_idx on mira_profiles (handle_lc);
