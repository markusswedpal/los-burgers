-- Applied 2026-11-02: scores above 5000 were rejected. The cap is now 100000.
alter table public.scores drop constraint if exists scores_score_check;
alter table public.scores add constraint scores_score_check check (score >= 1 and score <= 100000);
-- and in submit_score: replace "p_score > 5000" with "p_score > 100000" (see schema.sql for the full function)
