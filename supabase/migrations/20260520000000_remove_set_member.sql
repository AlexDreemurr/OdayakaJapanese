create or replace function public.remove_set_member(
  p_set_id bigint,
  p_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    return 'not_authenticated';
  end if;

  if p_user_id = current_user_id then
    return 'cannot_remove_self';
  end if;

  if not exists (
    select 1
    from public.set_members
    where set_id = p_set_id
      and user_id = current_user_id
      and role = 'owner'
  ) then
    return 'forbidden';
  end if;

  delete from public.set_members
  where set_id = p_set_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;
