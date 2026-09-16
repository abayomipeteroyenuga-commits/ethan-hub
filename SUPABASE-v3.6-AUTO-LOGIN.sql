-- Ethan Hub v3.6: allow each verified Ethan ID to read its own profile
grant usage on schema public to authenticated;
grant select, update on table public.ethan_profiles to authenticated;
drop policy if exists "Users read own Ethan profile" on public.ethan_profiles;
create policy "Users read own Ethan profile" on public.ethan_profiles
for select to authenticated using (user_id=auth.uid());

create or replace function public.mark_my_ethan_email_verified()
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.ethan_profiles p
 set email_verified=true, approved=true,
     approved_at=coalesce(approved_at,now()), updated_at=now()
 from auth.users u
 where p.user_id=auth.uid() and u.id=auth.uid() and u.email_confirmed_at is not null;
end $$;
revoke all on function public.mark_my_ethan_email_verified() from public;
grant execute on function public.mark_my_ethan_email_verified() to authenticated;
