-- Public pre-approval submissions (run once in the **CRM / finance** Supabase project as postgres).
-- 1) Table stores anonymous web form payloads (no auth.users FK).
-- 2) SECURITY DEFINER RPC validates and inserts; granted to anon + authenticated.
-- 3) RLS: CRM staff (user_has_crm_access) may SELECT — requires sql/crm_security.sql already applied.
--
-- If the marketing site uses a **separate** Supabase project, run sql/crm_public_preapproval_leads_marketing_project.sql
-- there instead (no user_has_crm_access). CRM “Web leads” then only sees leads if you also run this file on the CRM
-- project or add a sync pipeline.

create table if not exists public.crm_public_preapproval_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  display_name text not null,
  email text not null,
  phone text not null,
  date_of_birth date not null,
  street text not null,
  line2 text,
  city text not null,
  province text not null,
  employer text not null,
  gross_monthly_income_cad numeric(12, 2) not null,
  vehicle_interest text,
  consent_contact boolean not null,
  consent_credit boolean not null
);

create index if not exists crm_public_preapproval_leads_created_at_idx
  on public.crm_public_preapproval_leads (created_at desc);

alter table public.crm_public_preapproval_leads enable row level security;

revoke all on table public.crm_public_preapproval_leads from public;
revoke all on table public.crm_public_preapproval_leads from anon, authenticated;

grant select on table public.crm_public_preapproval_leads to authenticated;

drop policy if exists crm_public_preapproval_leads_select on public.crm_public_preapproval_leads;

create policy crm_public_preapproval_leads_select on public.crm_public_preapproval_leads
  for select to authenticated
  using (public.user_has_crm_access());

create or replace function public.submit_public_preapproval_lead(
  p_display_name text,
  p_email text,
  p_phone text,
  p_date_of_birth date,
  p_street text,
  p_line2 text,
  p_city text,
  p_province text,
  p_employer text,
  p_gross_monthly_income_cad numeric,
  p_vehicle_interest text,
  p_consent_contact boolean,
  p_consent_credit boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_display_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_street text := trim(coalesce(p_street, ''));
  v_line2 text := nullif(trim(coalesce(p_line2, '')), '');
  v_city text := trim(coalesce(p_city, ''));
  v_prov text := trim(coalesce(p_province, ''));
  v_employer text := trim(coalesce(p_employer, ''));
  v_vehicle text := nullif(trim(coalesce(p_vehicle_interest, '')), '');
  v_income numeric := coalesce(p_gross_monthly_income_cad, -1);
  new_id uuid;
begin
  if p_consent_contact is not true or p_consent_credit is not true then
    return jsonb_build_object('ok', false, 'error', 'Both consent checkboxes must be accepted.');
  end if;

  if length(v_name) < 2 or length(v_name) > 200 then
    return jsonb_build_object('ok', false, 'error', 'Please enter a valid full name.');
  end if;

  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' or length(v_email) > 320 then
    return jsonb_build_object('ok', false, 'error', 'Please enter a valid email address.');
  end if;

  if length(v_phone) = 11 and left(v_phone, 1) = '1' then
    v_phone := substr(v_phone, 2);
  end if;
  if length(v_phone) <> 10 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid 10-digit phone number (US/Canada).');
  end if;

  if p_date_of_birth is null then
    return jsonb_build_object('ok', false, 'error', 'Date of birth is required.');
  end if;
  if p_date_of_birth > current_date or p_date_of_birth < (current_date - interval '120 years') then
    return jsonb_build_object('ok', false, 'error', 'Please enter a valid date of birth.');
  end if;

  if length(v_street) < 1 or length(v_street) > 300 then
    return jsonb_build_object('ok', false, 'error', 'Please enter a street address.');
  end if;

  if v_line2 is not null and length(v_line2) > 200 then
    return jsonb_build_object('ok', false, 'error', 'Apt / suite is too long.');
  end if;

  if length(v_city) < 1 or length(v_city) > 120 then
    return jsonb_build_object('ok', false, 'error', 'Please enter a city.');
  end if;

  if length(v_prov) < 1 or length(v_prov) > 80 then
    return jsonb_build_object('ok', false, 'error', 'Please enter a province or state.');
  end if;

  if length(v_employer) < 1 or length(v_employer) > 200 then
    return jsonb_build_object('ok', false, 'error', 'Please enter an employer.');
  end if;

  if v_income is null or v_income < 0 or v_income > 1000000 then
    return jsonb_build_object('ok', false, 'error', 'Please enter a realistic gross monthly income.');
  end if;

  if v_vehicle is not null and length(v_vehicle) > 4000 then
    return jsonb_build_object('ok', false, 'error', 'Vehicle notes are too long.');
  end if;

  insert into public.crm_public_preapproval_leads (
    display_name,
    email,
    phone,
    date_of_birth,
    street,
    line2,
    city,
    province,
    employer,
    gross_monthly_income_cad,
    vehicle_interest,
    consent_contact,
    consent_credit
  ) values (
    v_name,
    v_email,
    v_phone,
    p_date_of_birth,
    v_street,
    v_line2,
    v_city,
    v_prov,
    v_employer,
    v_income,
    v_vehicle,
    true,
    true
  )
  returning id into new_id;

  return jsonb_build_object('ok', true, 'id', new_id::text);
end;
$$;

grant execute on function public.submit_public_preapproval_lead(
  text, text, text, date, text, text, text, text, text, numeric, text, boolean, boolean
) to anon, authenticated;
