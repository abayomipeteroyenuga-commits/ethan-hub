-- Ethan Hub v3.1: verified email = active Hub access
update public.ethan_profiles p set approved=true,approved_at=coalesce(approved_at,now()),updated_at=now()
from auth.users u where p.user_id=u.id and u.email_confirmed_at is not null;

create or replace function public.mark_my_ethan_email_verified()
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.ethan_profiles p
 set email_verified=true,approved=true,approved_at=coalesce(approved_at,now()),updated_at=now()
 from auth.users u
 where p.user_id=auth.uid() and u.id=auth.uid() and u.email_confirmed_at is not null;
end $$;
revoke all on function public.mark_my_ethan_email_verified() from public;
grant execute on function public.mark_my_ethan_email_verified() to authenticated;

drop policy if exists "Super admins read profiles" on public.ethan_profiles;
drop policy if exists "Super admins update profiles" on public.ethan_profiles;
drop policy if exists "Users read own Ethan profile" on public.ethan_profiles;
create policy "Users read own Ethan profile" on public.ethan_profiles for select to authenticated using(user_id=auth.uid());
