-- Mark helped daily scores so a Tip run can never sit on the public board
-- and a later withdraw cannot delete a clean unhelped mark.
alter table mira_scores add column if not exists helped boolean not null default false;
