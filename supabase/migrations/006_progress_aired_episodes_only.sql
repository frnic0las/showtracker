-- 006_progress_aired_episodes_only.sql
--
-- Fix: get_user_series_with_progress counted every cached episode as unwatched,
-- regardless of air date. Series whose only unwatched episodes have not aired yet
-- surfaced in "Continue watching" (e.g. Lupin S3, all episodes airing later), and
-- the unwatched badge showed the full season count instead of the aired-unwatched
-- count (e.g. Silo S3 showed 10 when only 1 episode had aired).
--
-- The ep CTE now filters to aired episodes only (air_date null or in the past).
-- Because total_episodes, unwatched_count and next_episode all derive from ep,
-- this single filter fixes the counts and the "next episode" pointer together:
-- progress reflects what the user can watch today (e.g. "1/1" not "0/10"), and the
-- existing continueWatching filter (unwatched_count > 0) hides caught-up series.

create or replace function get_user_series_with_progress(p_user_id uuid)
returns table (
  tmdb_id integer,
  status text,
  title text,
  poster_path text,
  total_episodes bigint,
  unwatched_count bigint,
  next_season_number smallint,
  next_episode_number smallint,
  next_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  with tracked as (
    select us.tmdb_id, us.status
    from user_series us
    where us.user_id = p_user_id
  ),
  ep as (
    select
      ec.tmdb_series_id,
      ec.season_number,
      ec.episode_number,
      ec.name,
      (ue.id is not null) as watched
    from episodes_cache ec
    join tracked t on t.tmdb_id = ec.tmdb_series_id
    left join user_episodes ue
      on ue.user_id = p_user_id
      and ue.tmdb_series_id = ec.tmdb_series_id
      and ue.season_number = ec.season_number
      and ue.episode_number = ec.episode_number
    where ec.season_number > 0
      and (ec.air_date is null or ec.air_date <= current_date)
  ),
  agg as (
    select
      tmdb_series_id,
      count(*) as total_episodes,
      count(*) filter (where not watched) as unwatched_count
    from ep
    group by tmdb_series_id
  ),
  next_ep as (
    select distinct on (tmdb_series_id)
      tmdb_series_id, season_number, episode_number, name
    from ep
    where not watched
    order by tmdb_series_id, season_number, episode_number
  )
  select
    t.tmdb_id,
    t.status,
    sc.title,
    sc.poster_path,
    coalesce(a.total_episodes, 0) as total_episodes,
    coalesce(a.unwatched_count, 0) as unwatched_count,
    n.season_number as next_season_number,
    n.episode_number as next_episode_number,
    n.name as next_name
  from tracked t
  join series_cache sc on sc.tmdb_id = t.tmdb_id
  left join agg a on a.tmdb_series_id = t.tmdb_id
  left join next_ep n on n.tmdb_series_id = t.tmdb_id
  order by sc.title asc;
$$;
