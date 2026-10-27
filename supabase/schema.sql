-- Shared leaderboard for LO's Burgers (Supabase / Postgres).
-- Players can read the board and add a score through submit_score(); nothing else.

create table public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 14),
  score integer not null check (score between 1 and 5000),
  season text check (season is null or char_length(season) <= 12),
  device uuid,
  created_at timestamptz not null default now()
);

create index scores_rank_idx on public.scores (score desc, id asc);
create index scores_device_idx on public.scores (device, created_at desc);

alter table public.scores enable row level security;
create policy scores_read on public.scores for select to anon, authenticated using (true);

revoke all on public.scores from anon, authenticated;
grant select (id, name, score, season, created_at) on public.scores to anon, authenticated;

create or replace function public.submit_score(
  p_name text,
  p_score integer,
  p_season text default null,
  p_device uuid default null
)
returns table (out_id bigint, out_rank integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_id bigint;
  v_rank integer;
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

  return query select v_id, v_rank;
end;
$$;

revoke all on function public.submit_score(text, integer, text, uuid) from public;
grant execute on function public.submit_score(text, integer, text, uuid) to anon, authenticated;
