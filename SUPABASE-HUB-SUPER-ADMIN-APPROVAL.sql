-- ETHAN HUB v2.1 — SUPER ADMIN APPROVAL GATE
-- Run this entire script in the Ethan ID Supabase SQL Editor.

create table if not exists public.ethan_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student'
    check (role in ('student','professional','business_owner','instructor','admin','super_admin')),
  approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ethan_profiles add column if not exists approved boolean not null default false;
alter table public.ethan_profiles add column if not exists approved_at timestamptz;
alter table public.ethan_profiles add column if not exists approved_by uuid references auth.users(id);

alter table public.ethan_profiles enable row level security;

-- Automatically create a PENDING profile for every new Ethan ID.
create or replace function public.create_ethan_profile()
returns trigger language plpgsql security definer set search_path=public as $$
declare requested text;
begin
  requested := lower(coalesce(new.raw_user_meta_data->>'learner_type','student'));
  if requested not in ('student','professional','business owner','business_owner','business-owner') then requested := 'student'; end if;
  if requested in ('business owner','business-owner') then requested := 'business_owner'; end if;
  insert into public.ethan_profiles(user_id,role,approved)
  values(new.id,requested,false)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_ethan_user_created on auth.users;
create trigger on_ethan_user_created after insert on auth.users
for each row execute function public.create_ethan_profile();

-- A user may read only their own approval state.
drop policy if exists "Users read own Ethan profile" on public.ethan_profiles;
create policy "Users read own Ethan profile" on public.ethan_profiles
for select to authenticated using (auth.uid()=user_id);

-- Super Admins may read all profiles.
drop policy if exists "Super admins read profiles" on public.ethan_profiles;
create policy "Super admins read profiles" on public.ethan_profiles
for select to authenticated using (
 exists(select 1 from public.ethan_profiles me where me.user_id=auth.uid() and me.role='super_admin' and me.approved=true)
);

-- Super Admins may approve/reject and assign roles.
drop policy if exists "Super admins update profiles" on public.ethan_profiles;
create policy "Super admins update profiles" on public.ethan_profiles
for update to authenticated
using (
 exists(select 1 from public.ethan_profiles me where me.user_id=auth.uid() and me.role='super_admin' and me.approved=true)
)
with check (
 role in ('student','professional','business_owner','instructor','admin','super_admin')
);

-- IMPORTANT BOOTSTRAP:
-- After running this script, set ONLY your existing Super Admin account once in SQL.
-- Replace YOUR-SUPER-ADMIN-USER-UUID below, then run these two lines separately:
-- update public.ethan_profiles set role='super_admin', approved=true, approved_at=now()
-- where user_id='YOUR-SUPER-ADMIN-USER-UUID';

-- Existing auth users created before this trigger can be inserted as pending:
insert into public.ethan_profiles(user_id,role,approved)
select id,
 case
  when lower(coalesce(raw_user_meta_data->>'learner_type','student')) in ('professional') then 'professional'
  when lower(coalesce(raw_user_meta_data->>'learner_type','student')) in ('business owner','business_owner','business-owner') then 'business_owner'
  else 'student'
 end,
 false
from auth.users
on conflict(user_id) do nothing;
