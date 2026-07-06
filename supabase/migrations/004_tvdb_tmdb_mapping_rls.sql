-- 004_tvdb_tmdb_mapping_rls.sql
--
-- The tvdb_tmdb_mapping table shipped in 001 without RLS, unlike every other
-- table. Without RLS, PostgREST exposes it to the anon and authenticated roles
-- by default. The data is only public TVDB->TMDB ID mappings, so the risk is
-- low, but it violates the project convention that RLS is mandatory on all
-- tables. This mirrors the cache tables: authenticated users may read, and
-- only the service role (used by the import script, which bypasses RLS) writes.
-- No anon access is needed.

alter table tvdb_tmdb_mapping enable row level security;

create policy "mapping_select" on tvdb_tmdb_mapping for select to authenticated using (true);
