-- Daily and endless high scores. One row per user per mode per day
-- (endless uses date_key ''). Writes are always scoped to user_id.
create table if not exists mira_scores (
  id          serial primary key,
  user_id     text not null,
  handle      text not null,
  mode        text not null,
  date_key    text not null default '',
  score       integer not null,
  glyphs      text,
  updated_at  timestamptz not null default now(),
  unique (user_id, mode, date_key)
);

create index if not exists mira_scores_daily_idx
  on mira_scores (mode, date_key, score desc);
