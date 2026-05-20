create or replace function public.update_vocabulary_item(
  p_vocabulary_id bigint,
  p_word text,
  p_reading text,
  p_pitch integer,
  p_meaning text,
  p_contributor_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_set_id bigint;
begin
  if current_user_id is null then
    return 'not_authenticated';
  end if;

  select set_id
    into target_set_id
  from public.vocabulary
  where id = p_vocabulary_id;

  if not found then
    return 'not_found';
  end if;

  if not exists (
    select 1
    from public.set_members
    where set_id = target_set_id
      and user_id = current_user_id
      and (
        role = 'owner'
        or (role = 'admin' and can_edit_phrases = true)
      )
  ) then
    return 'forbidden';
  end if;

  update public.vocabulary
  set
    word = nullif(trim(p_word), ''),
    reading = nullif(trim(p_reading), ''),
    pitch = p_pitch,
    meaning = nullif(trim(p_meaning), ''),
    contributor_name = nullif(trim(coalesce(p_contributor_name, '')), '')
  where id = p_vocabulary_id;

  return 'ok';
end;
$$;

create or replace function public.delete_vocabulary_item(
  p_vocabulary_id bigint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_set_id bigint;
begin
  if current_user_id is null then
    return 'not_authenticated';
  end if;

  select set_id
    into target_set_id
  from public.vocabulary
  where id = p_vocabulary_id;

  if not found then
    return 'not_found';
  end if;

  if not exists (
    select 1
    from public.set_members
    where set_id = target_set_id
      and user_id = current_user_id
      and (
        role = 'owner'
        or (role = 'admin' and can_edit_phrases = true)
      )
  ) then
    return 'forbidden';
  end if;

  delete from public.vocabulary
  where id = p_vocabulary_id;

  return 'ok';
end;
$$;
