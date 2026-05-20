alter table public.user_profiles
  add column if not exists email text;

alter table public.user_profiles
  add column if not exists display_name text;

drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile"
  on public.user_profiles
  for select
  using (auth.uid() is not null);
