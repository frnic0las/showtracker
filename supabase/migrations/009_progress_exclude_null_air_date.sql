-- 009_progress_exclude_null_air_date.sql
--
-- Issue #116: series with unaired episodes still surfaced in "Continue
-- watching". Migration 006 restricted the progress CTE to aired episodes but
-- kept an `air_date is null` escape hatch, which treats an episode with an
-- unknown air date as already released. TMDB fills in `air_date` only once a
-- date is announced, so an announced-but-undated episode (Ahsoka S2 E2-E8) was
-- counted as watchable: badge of 7 and a "Next: S2 E2" pointer for a season
-- that has not started.
--
-- An episode with no air date has not been released. Drop the null branch so
-- total_episodes, unwatched_count and next_episode — all derived from `ep` —
-- are corrected together. Series with nothing aired-and-unwatched then fall out
-- of "Continue watching" through the existing unwatchedCount > 0 filter.
--
-- Accepted trade-off: an episode that did air but is missing its air_date in
-- TMDB no longer counts. The series detail page already labels those "TBA", so
-- the two views agree.
--
-- Everything else is unchanged from migration 007.

drop function if exists get_user_series_with_progress(uuid);

create function get_user_series_with_progress(p_user_id uuid)
returns table (
  tmdb_id integer,
  status text,
  series_status text,
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
      and ec.air_date is not null
      and ec.air_date <= current_date
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
    sc.status as series_status,
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
