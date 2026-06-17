-- Editable job-position groups (directory "positions"). Run once in Supabase SQL Editor as postgres.
-- Requires: sql/crm_user_directory_positions.sql, sql/crm_position_permissions.sql
--
-- Seeds the five legacy positions. Only one group is the default role for new team members (Sales).
-- Master may create, rename, reorder, or remove groups. Master and permission admins may change the default role.

-- ---------------------------------------------------------------------------
-- Groups table
-- ---------------------------------------------------------------------------

create table if not exists public.crm_directory_groups (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_]{0,47}$'),
  label text not null check (char_length(trim(label)) >= 1),
  rank integer not null default 1 check (rank >= 1 and rank <= 999),
  sort_order integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_directory_groups_rank_idx
  on public.crm_directory_groups (rank desc, sort_order, slug);

insert into public.crm_directory_groups (slug, label, rank, sort_order, is_default)
values
  ('general_manager', 'General Manager', 5, 50, false),
  ('general_sales_manager', 'General Sales Manager', 4, 40, false),
  ('sales_manager', 'Sales Manager', 3, 30, false),
  ('finance_manager', 'Finance Manager', 2, 20, false),
  ('sales', 'Sales', 1, 10, true)
on conflict (slug) do update
set
  label = excluded.label,
  rank = excluded.rank,
  sort_order = excluded.sort_order;

-- Fix legacy installs that marked every seeded group as default; preserve a single default when already valid.
do $$
begin
  if (select count(*) from public.crm_directory_groups where is_default) <> 1 then
    update public.crm_directory_groups set is_default = false;
    update public.crm_directory_groups
    set is_default = true
    where slug = coalesce(
      (select g.slug from public.crm_directory_groups g where g.slug = 'sales'),
      (
        select g.slug
        from public.crm_directory_groups g
        order by g.rank asc, g.sort_order asc, g.slug asc
        limit 1
      )
    );
  end if;
end $$;

create unique index if not exists crm_directory_groups_one_default_idx
  on public.crm_directory_groups ((is_default))
  where is_default;

-- ---------------------------------------------------------------------------
-- Link directory users + permissions to groups
-- ---------------------------------------------------------------------------

alter table public.crm_user_directory drop constraint if exists crm_user_directory_position_check;

alter table public.crm_user_directory drop constraint if exists crm_user_directory_position_fkey;

alter table public.crm_user_directory
  add constraint crm_user_directory_position_fkey
  foreign key (position)
  references public.crm_directory_groups (slug)
  on update cascade
  on delete restrict;

alter table public.crm_position_permissions drop constraint if exists crm_position_permissions_position_check;

alter table public.crm_position_permissions drop constraint if exists crm_position_permissions_position_fkey;

alter table public.crm_position_permissions
  add constraint crm_position_permissions_position_fkey
  foreign key (position)
  references public.crm_directory_groups (slug)
  on update cascade
  on delete restrict;

-- ---------------------------------------------------------------------------
-- Rank helper reads live group ranks
-- ---------------------------------------------------------------------------

create or replace function public.crm_user_directory_position_rank(p_position text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select g.rank
      from public.crm_directory_groups g
      where g.slug = p_position
    ),
    1
  );
$$;

grant execute on function public.crm_user_directory_position_rank(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Default role for new team members
-- ---------------------------------------------------------------------------

create or replace function public.crm_directory_default_group_slug()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select g.slug
      from public.crm_directory_groups g
      where g.is_default
      limit 1
    ),
    'sales'
  );
$$;

grant execute on function public.crm_directory_default_group_slug() to authenticated;

create or replace function public.set_crm_directory_default_group(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.crm_user_directory_master() or public.crm_user_is_permissions_admin()) then
    raise exception 'Not authorized to change the default role';
  end if;

  if not exists (select 1 from public.crm_directory_groups g where g.slug = p_slug) then
    raise exception 'Unknown group';
  end if;

  update public.crm_directory_groups
  set is_default = false, updated_at = now()
  where is_default;

  update public.crm_directory_groups
  set is_default = true, updated_at = now()
  where slug = p_slug;
end;
$$;

grant execute on function public.set_crm_directory_default_group(text) to authenticated;

create or replace function public.crm_user_directory_apply_default_position()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.position := public.crm_directory_default_group_slug();
  end if;

  return new;
end;
$$;

drop trigger if exists crm_user_directory_apply_default_position on public.crm_user_directory;
create trigger crm_user_directory_apply_default_position
  before insert on public.crm_user_directory
  for each row
  execute function public.crm_user_directory_apply_default_position();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.crm_directory_groups enable row level security;

revoke all on table public.crm_directory_groups from public, anon;

drop policy if exists crm_directory_groups_select on public.crm_directory_groups;
drop policy if exists crm_directory_groups_insert on public.crm_directory_groups;
drop policy if exists crm_directory_groups_update on public.crm_directory_groups;
drop policy if exists crm_directory_groups_delete on public.crm_directory_groups;

create policy crm_directory_groups_select on public.crm_directory_groups
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_directory_groups_insert on public.crm_directory_groups
  for insert to authenticated
  with check (public.crm_user_directory_master());

create policy crm_directory_groups_update on public.crm_directory_groups
  for update to authenticated
  using (public.crm_user_directory_master())
  with check (public.crm_user_directory_master());

create policy crm_directory_groups_delete on public.crm_directory_groups
  for delete to authenticated
  using (public.crm_user_directory_master());

grant select on table public.crm_directory_groups to authenticated;
grant insert, update, delete on table public.crm_directory_groups to authenticated;

notify pgrst, 'reload schema';
