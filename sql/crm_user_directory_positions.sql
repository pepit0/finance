-- Run once in Supabase SQL Editor for existing CRM databases.
-- Replaces delegated directory admins with team positions (authority order below).
-- Master account (full control): danielsharifian@gmail.com
--
-- Positions (highest → lowest authority):
--   general_manager, general_sales_manager, sales_manager, finance_manager, sales
--
-- Managers (all except sales) receive the same elevated CRM permissions that
-- delegated directory admins previously had (moderation, delete, team to-do admin, etc.).

-- ---------------------------------------------------------------------------
-- Master account
-- ---------------------------------------------------------------------------

create or replace function public.crm_user_directory_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = lower('danielsharifian@gmail.com');
$$;

grant execute on function public.crm_user_directory_master() to authenticated;

-- ---------------------------------------------------------------------------
-- Position column
-- ---------------------------------------------------------------------------

alter table public.crm_user_directory
  add column if not exists position text not null default 'sales';

alter table public.crm_user_directory
  drop constraint if exists crm_user_directory_position_check;

alter table public.crm_user_directory
  add constraint crm_user_directory_position_check
  check (
    position in (
      'general_manager',
      'general_sales_manager',
      'sales_manager',
      'finance_manager',
      'sales'
    )
  );

update public.crm_user_directory
set position = 'sales'
where position is null or trim(position) = '';

-- ---------------------------------------------------------------------------
-- Authority helpers
-- ---------------------------------------------------------------------------

create or replace function public.crm_user_directory_position_rank(p_position text)
returns integer
language sql
immutable
as $$
  select case p_position
    when 'general_manager' then 5
    when 'general_sales_manager' then 4
    when 'sales_manager' then 3
    when 'finance_manager' then 2
    when 'sales' then 1
    else 1
  end;
$$;

grant execute on function public.crm_user_directory_position_rank(text) to authenticated;

create or replace function public.crm_user_directory_caller_rank()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.crm_user_directory_master() then 999
    else coalesce(
      (
        select public.crm_user_directory_position_rank(d.position)
        from public.crm_user_directory d
        where d.user_id = auth.uid()
      ),
      1
    )
  end;
$$;

grant execute on function public.crm_user_directory_caller_rank() to authenticated;

create or replace function public.crm_user_can_manage_directory_user(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_user_directory_master()
    or (
      p_target_user_id is not null
      and p_target_user_id = auth.uid()
    )
    or (
      p_target_user_id is not null
      and p_target_user_id <> auth.uid()
      and public.crm_user_directory_caller_rank() >
        coalesce(
          (
            select public.crm_user_directory_position_rank(d.position)
            from public.crm_user_directory d
            where d.user_id = p_target_user_id
          ),
          1
        )
    );
$$;

grant execute on function public.crm_user_can_manage_directory_user(uuid) to authenticated;

create or replace function public.crm_user_directory_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_user_directory_master()
    or exists (
      select 1
      from public.crm_user_directory d
      where d.user_id = auth.uid()
        and d.position <> 'sales'
    );
$$;

grant execute on function public.crm_user_directory_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: manage by authority rank (not flat delegated-admin list)
-- ---------------------------------------------------------------------------

drop policy if exists crm_user_directory_update on public.crm_user_directory;

create policy crm_user_directory_update on public.crm_user_directory
  for update to authenticated
  using (
    public.user_has_crm_access()
    and public.crm_user_can_manage_directory_user(user_id)
  )
  with check (
    public.user_has_crm_access()
    and public.crm_user_can_manage_directory_user(user_id)
  );

-- ---------------------------------------------------------------------------
-- Triggers: lock identifiers; enforce position assignment rules
-- ---------------------------------------------------------------------------

create or replace function public.crm_user_directory_protect_identifiers()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id or new.email is distinct from old.email then
    raise exception 'Cannot change user_id or email';
  end if;

  if new.position is distinct from old.position then
    if public.crm_user_directory_master() then
      null;
    elsif old.user_id = auth.uid() then
      raise exception 'Cannot change your own position';
    elsif public.crm_user_directory_caller_rank() <= public.crm_user_directory_position_rank(old.position) then
      raise exception 'Insufficient authority to change this user''s position';
    elsif public.crm_user_directory_position_rank(new.position) >= public.crm_user_directory_caller_rank() then
      raise exception 'Cannot assign a position equal to or above your own';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists crm_user_directory_protect_identifiers on public.crm_user_directory;
create trigger crm_user_directory_protect_identifiers
  before update on public.crm_user_directory
  for each row
  execute function public.crm_user_directory_protect_identifiers();

notify pgrst, 'reload schema';
