-- Feath prototype short links (product-site /share → /v/:id)
-- Run in the marketing / Feath Board Supabase project (SQL Editor).

create table if not exists public.feath_prototype_shares (
  id text primary key,
  embed_src text not null,
  title text not null default '',
  created_at timestamptz not null default now()
);

-- Allow figma.com embeds/protos/Make and published *.figma.site apps
alter table public.feath_prototype_shares
  drop constraint if exists feath_prototype_shares_embed_src_figma;

alter table public.feath_prototype_shares
  add constraint feath_prototype_shares_embed_src_figma check (
    embed_src ~* '^https://([a-z0-9-]+\.)?figma\.com/'
    or embed_src ~* '^https://[a-z0-9-]+\.figma\.site(/|$|\?)'
  );

create index if not exists feath_prototype_shares_created_at_idx
  on public.feath_prototype_shares (created_at desc);

alter table public.feath_prototype_shares enable row level security;

revoke all on table public.feath_prototype_shares from public;
revoke all on table public.feath_prototype_shares from anon, authenticated;

drop policy if exists feath_prototype_shares_select on public.feath_prototype_shares;
create policy feath_prototype_shares_select
  on public.feath_prototype_shares
  for select
  to anon, authenticated
  using (true);

grant select on table public.feath_prototype_shares to anon, authenticated;

create or replace function public.create_feath_prototype_share(
  p_embed_src text,
  p_title text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src text := trim(p_embed_src);
  v_title text := coalesce(trim(p_title), '');
  v_id text;
  v_alphabet text := 'abcdefghijkmnopqrstuvwxyz23456789';
  v_i int;
  v_attempt int := 0;
begin
  if v_src is null or length(v_src) < 12 or length(v_src) > 4000 then
    raise exception 'invalid embed_src';
  end if;

  if v_src !~* '^https://([a-z0-9-]+\.)?figma\.com/'
     and v_src !~* '^https://[a-z0-9-]+\.figma\.site(/|$|\?)' then
    raise exception 'embed_src must be a figma.com or *.figma.site URL';
  end if;

  if length(v_title) > 120 then
    v_title := left(v_title, 120);
  end if;

  loop
    v_id := '';
    for v_i in 1..8 loop
      v_id := v_id || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    begin
      insert into public.feath_prototype_shares (id, embed_src, title)
      values (v_id, v_src, v_title);
      return v_id;
    exception
      when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt >= 8 then
          raise exception 'could not allocate share id';
        end if;
    end;
  end loop;
end;
$$;

revoke all on function public.create_feath_prototype_share(text, text) from public;
grant execute on function public.create_feath_prototype_share(text, text) to anon, authenticated;
