-- 003_calendar_catchup.sql
--
-- Aggregation RPC for the Calendar page's "Catch up" section: aired-but-
-- unwatched episodes across every series the user is `watching`. Computing
-- this in the app would require transferring every cached episode plus every
-- watched row for all watching series (tens of thousands after a TV Time
-- import) and, worse, PostgREST caps result sets at 1000 rows by default —
-- silently truncating the anti-join and misreporting what's left to catch up
-- on. Pushing the join + anti-join into the database returns only the rows
-- that actually matter.
--
-- SECURITY INVOKER (the default) keeps Row Level Security in force: the
-- user_series / user_episodes reads are still scoped to auth.uid(), so a
-- caller can only ever see their own catch-up list. Season 0 (specials) is
-- excluded, matching the rest of the progress model.

create or replace function get_user_catchup_episodes(p_user_id uuid)
returns table (
  tmdb_id integer,
  title text,
  poster_path text,
  season_number smallint,
  episode_number smallint,
  name text,
  air_date date
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ec.tmdb_series_id as tmdb_id,
    sc.title,
    sc.poster_path,
    ec.season_number,
    ec.episode_number,
    ec.name,
    ec.air_date
  from episodes_cache ec
  join user_series us
    on us.tmdb_id = ec.tmdb_series_id
    and us.user_id = p_user_id
    and us.status = 'watching'
  join series_cache sc on sc.tmdb_id = ec.tmdb_series_id
  left join user_episodes ue
    on ue.user_id = p_user_id
    and ue.tmdb_series_id = ec.tmdb_series_id
    and ue.season_number = ec.season_number
    and ue.episode_number = ec.episode_number
  where ec.season_number > 0
    and ec.air_date is not null
    and ec.air_date < (now() at time zone 'utc')::date
    and ue.id is null
  order by ec.air_date asc, ec.tmdb_series_id asc, ec.season_number asc, ec.episode_number asc;
$$;
