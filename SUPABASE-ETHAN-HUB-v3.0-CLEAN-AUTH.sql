-- ETHAN HUB v3.0 — CLEAN ETHAN ID + EMAIL VERIFICATION + SUPER ADMIN APPROVAL
create table if not exists public.ethan_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 email text,
 role text not null default 'student',
 email_verified boolean not null default false,
 approved boolean not null default false,
 approved_at timestamptz,
 approved_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.ethan_profiles add column if not exists full_name text;
alter table public.ethan_profiles add column if not exists email text;
alter table public.ethan_profiles add column if not exists email_verified boolean not null default false;

create or replace function public.create_ethan_profile()
returns trigger language plpgsql security definer set search_path=public as $$
declare r text;
begin
 r:=lower(replace(replace(coalesce(new.raw_user_meta_data->>'learner_type','student'),' ','_'),'-','_'));
 if r not in ('student','professional','business_owner') then r:='student'; end if;
 insert into public.ethan_profiles(user_id,full_name,email,role,email_verified,approved)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email,r,(new.email_confirmed_at is not null),false)
 on conflict(user_id) do update set full_name=excluded.full_name,email=excluded.email;
 return new;
end $$;
drop trigger if exists on_ethan_user_created on auth.users;
create trigger on_ethan_user_created after insert on auth.users for each row execute function public.create_ethan_profile();

-- Backfill existing Ethan IDs without destroying existing approvals/roles.
insert into public.ethan_profiles(user_id,full_name,email,role,email_verified,approved)
select id,coalesce(raw_user_meta_data->>'full_name',''),email,
 case when lower(replace(replace(coalesce(raw_user_meta_data->>'learner_type','student'),' ','_'),'-','_')) in ('student','professional','business_owner')
 then lower(replace(replace(coalesce(raw_user_meta_data->>'learner_type','student'),' ','_'),'-','_')) else 'student' end,
 (email_confirmed_at is not null),false
from auth.users on conflict(user_id) do update
set email=excluded.email, full_name=coalesce(nullif(public.ethan_profiles.full_name,''),excluded.full_name),
email_verified=excluded.email_verified;

create or replace function public.mark_my_ethan_email_verified()
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.ethan_profiles p set email_verified=true,updated_at=now()
 from auth.users u where p.user_id=auth.uid() and u.id=auth.uid() and u.email_confirmed_at is not null;
end $$;
revoke all on function public.mark_my_ethan_email_verified() from public;
grant execute on function public.mark_my_ethan_email_verified() to authenticated;

create or replace function public.is_ethan_super_admin()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.ethan_profiles where user_id=auth.uid() and role='super_admin' and approved=true and email_verified=true);
$$;
revoke all on function public.is_ethan_super_admin() from public;
grant execute on function public.is_ethan_super_admin() to authenticated;

alter table public.ethan_profiles enable row level security;
drop policy if exists "Users read own Ethan profile" on public.ethan_profiles;
drop policy if exists "Super admins read profiles" on public.ethan_profiles;
drop policy if exists "Super admins update profiles" on public.ethan_profiles;
create policy "Users read own Ethan profile" on public.ethan_profiles for select to authenticated using(user_id=auth.uid());
create policy "Super admins read profiles" on public.ethan_profiles for select to authenticated using(public.is_ethan_super_admin());
create policy "Super admins update profiles" on public.ethan_profiles for update to authenticated using(public.is_ethan_super_admin()) with check(public.is_ethan_super_admin());
