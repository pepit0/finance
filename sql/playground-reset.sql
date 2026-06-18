-- Wipe playground public schema only (keeps Auth users).
-- Run in SQL Editor BEFORE re-pasting playground-with-seed.sql.
-- Do NOT run on Temptation production.

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
grant all on schema public to anon, authenticated;

alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

notify pgrst, 'reload schema';
