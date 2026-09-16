-- Ethan Hub v2.2 Super Admin approval dashboard policies
create or replace function public.is_ethan_super_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
 select exists(
   select 1 from public.ethan_profiles
   where user_id=auth.uid() and role='super_admin' and approved=true
 );
$$;

revoke all on function public.is_ethan_super_admin() from public;
grant execute on function public.is_ethan_super_admin() to authenticated;

drop policy if exists "Super admins read profiles" on public.ethan_profiles;
create policy "Super admins read profiles" on public.ethan_profiles
for select to authenticated using (public.is_ethan_super_admin());

drop policy if exists "Super admins update profiles" on public.ethan_profiles;
create policy "Super admins update profiles" on public.ethan_profiles
for update to authenticated
using (public.is_ethan_super_admin())
with check (public.is_ethan_super_admin());

-- Ordinary authenticated users retain read access to their own profile only.
