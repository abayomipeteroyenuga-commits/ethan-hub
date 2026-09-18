-- ETHAN HUB v5.0 — optional Free / Plus / Pro plan framework
-- Run once in the SAME Supabase project used by Ethan Hub.
-- This adds plan metadata only. It does NOT process payments.
alter table public.ethan_profiles
  add column if not exists plan text not null default 'free';

alter table public.ethan_profiles
  drop constraint if exists ethan_profiles_plan_check;
alter table public.ethan_profiles
  add constraint ethan_profiles_plan_check check (plan in ('free','plus','pro'));

-- Existing users remain on Free unless an authorised backend/admin process changes them.
update public.ethan_profiles set plan='free' where plan is null or plan not in ('free','plus','pro');
