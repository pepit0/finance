-- Run once in Supabase SQL Editor for projects that already have crm_customers
-- (adds optional secondary phone and date of birth).

alter table public.crm_customers add column if not exists secondary_phone text;
alter table public.crm_customers add column if not exists date_of_birth date;
