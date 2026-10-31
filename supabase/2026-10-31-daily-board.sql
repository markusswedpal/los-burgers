-- Daily top-10 board + top-100 all-time board for LO's Burgers.
-- Run in the Supabase SQL editor (project pvvgkrbxsaqngekxqlki), then run the clear statement at the bottom once.

create index if not exists scores_created_idx on public.scores (created_at desc);

-- Today's best scores; "today" is the Europe/Stockholm calendar day, so the board starts fresh every night.
create or replace function public.top_today(p_limit integer default 10)
returns table (id bigint, name text, score integer, season text, created_at timestamptz)
language sql
stable
set search_path = public
as $$
  select s.id, s.name, s.score, s.season, s.created_at
  from public.scores s
  where s.created_at >= (date_trunc('day', now() at time zone 'Europe/Stockholm') at time zone 'Europe/Stockholm')
  order by s.score desc, s.id asc
  limit least(greatest(coalesce(p_limit, 10), 1), 10)
$$;
grant execute on function public.top_today(integer) to anon, authenticated;

-- submit_score now also returns the rank among today's scores.
drop function if exists public.submit_score(text, integer, text, uuid);
create function public.submit_score(
  p_name text,
  p_score integer,
  p_season text default null,
  p_device uuid default null
)
returns table (out_id bigint, out_rank integer, out_day_rank integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_id bigint;
  v_rank integer;
  v_day integer;
  v_start timestamptz := (date_trunc('day', now() at time zone 'Europe/Stockholm') at time zone 'Europe/Stockholm');
begin
  v_name := left(btrim(regexp_replace(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g'), '\s+', ' ', 'g')), 14);
  if char_length(v_name) < 1 then
    raise exception 'name required';
  end if;
  if p_score is null or p_score < 1 or p_score > 5000 then
    raise exception 'invalid score';
  end if;
  if p_device is not null and (
    select count(*) from public.scores s where s.device = p_device and s.created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'slow down';
  end if;

  insert into public.scores (name, score, season, device)
  values (v_name, p_score, left(p_season, 12), p_device)
  returning id into v_id;

  select count(*) + 1 into v_rank
  from public.scores s
  where s.score > p_score or (s.score = p_score and s.id < v_id);

  select count(*) + 1 into v_day
  from public.scores s
  where s.created_at >= v_start and (s.score > p_score or (s.score = p_score and s.id < v_id));

  return query select v_id, v_rank, v_day;
end;
$$;
revoke all on function public.submit_score(text, integer, text, uuid) from public;
grant execute on function public.submit_score(text, integer, text, uuid) to anon, authenticated;

-- One-time: clear the leaderboard (deletes every saved score).
-- truncate table public.scores restart identity;
