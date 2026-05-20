create or replace function public.search_user_profiles(
  p_query text
)
returns table (
  user_id uuid,
  display_name text,
  email text,
  avatar_path text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    auth_users.id as user_id,
    profiles.display_name,
    auth_users.email,
    profiles.avatar_path
  from auth.users auth_users
  left join public.user_profiles profiles
    on profiles.user_id = auth_users.id
  where nullif(trim(p_query), '') is not null
    and (
      auth_users.email ilike '%' || trim(p_query) || '%'
      or profiles.display_name ilike '%' || trim(p_query) || '%'
    )
  order by
    case
      when profiles.display_name ilike trim(p_query) || '%' then 0
      when auth_users.email ilike trim(p_query) || '%' then 1
      else 2
    end,
    auth_users.email
  limit 8;
$$;
