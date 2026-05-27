alter table public.vocabulary_change_requests
  add column if not exists original_data jsonb not null default '{}'::jsonb;

alter table public.vocabulary_change_requests
  alter column vocabulary_id drop not null;

alter table public.vocabulary_change_requests
  drop constraint if exists vocabulary_change_requests_vocabulary_id_fkey;

alter table public.vocabulary_change_requests
  add constraint vocabulary_change_requests_vocabulary_id_fkey
  foreign key (vocabulary_id)
  references public.vocabulary(id)
  on delete set null;

create or replace function public.resolve_vocabulary_change_request(
  p_request_id bigint,
  p_resolution text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  request_record public.vocabulary_change_requests%rowtype;
  resolver_name text;
  resolver_avatar_path text;
  target_word text;
  result_content text;
  result_type text;
  next_pitch integer;
begin
  if current_user_id is null then
    return 'not_authenticated';
  end if;

  if p_request_id is null then
    return 'not_found';
  end if;

  if p_resolution not in ('approved', 'rejected') then
    return 'invalid_resolution';
  end if;

  select *
    into request_record
  from public.vocabulary_change_requests
  where id = p_request_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if request_record.status <> 'pending' then
    return 'already_resolved';
  end if;

  if not exists (
    select 1
    from public.set_members
    where set_id = request_record.set_id
      and user_id = current_user_id
      and (
        role = 'owner'
        or (role = 'admin' and can_edit_phrases = true)
      )
  ) then
    return 'forbidden';
  end if;

  target_word := coalesce(request_record.original_data ->> 'word', '未命名词条');

  if p_resolution = 'approved' then
    if request_record.action = 'delete' then
      delete from public.vocabulary
      where id = request_record.vocabulary_id;
    else
      if request_record.changes ? 'pitch' then
        next_pitch := nullif(request_record.changes ->> 'pitch', '')::integer;
      end if;

      update public.vocabulary
      set
        word = coalesce(nullif(trim(request_record.changes ->> 'word'), ''), word),
        reading = coalesce(nullif(trim(request_record.changes ->> 'reading'), ''), reading),
        pitch = case when request_record.changes ? 'pitch' then next_pitch else pitch end,
        meaning = coalesce(nullif(trim(request_record.changes ->> 'meaning'), ''), meaning),
        contributor_name = coalesce(
          nullif(trim(request_record.changes ->> 'contributor_name'), ''),
          contributor_name
        )
      where id = request_record.vocabulary_id;

      if not found then
        return 'not_found';
      end if;
    end if;
  end if;

  update public.vocabulary_change_requests
  set
    status = p_resolution,
    resolved_at = now(),
    resolved_by = current_user_id
  where id = p_request_id;

  update public.app_messages
  set metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{status}',
    to_jsonb(p_resolution::text),
    true
  )
  where metadata ->> 'kind' = 'vocabulary_change_request'
    and metadata ->> 'request_id' = p_request_id::text;

  select
    coalesce(nullif(display_name, ''), nullif(email, ''), '管理员'),
    avatar_path
    into resolver_name, resolver_avatar_path
  from public.user_profiles
  where user_id = current_user_id;

  resolver_name := coalesce(resolver_name, '管理员');
  result_type := case when p_resolution = 'approved' then 'success' else 'error' end;
  result_content :=
    '你关于词条「'
    || target_word
    || '」的'
    || case when request_record.action = 'delete' then '删除' else '修改' end
    || '申请已'
    || case when p_resolution = 'approved' then '通过。' else '被拒绝。' end;

  insert into public.app_messages (
    recipient_id,
    sender_id,
    sender_name,
    sender_avatar_path,
    type,
    content,
    metadata
  )
  values (
    request_record.requester_id,
    current_user_id,
    resolver_name,
    resolver_avatar_path,
    result_type,
    result_content,
    jsonb_build_object(
      'kind', 'vocabulary_change_request_result',
      'request_id', p_request_id,
      'resolution', p_resolution,
      'action', request_record.action,
      'vocabulary_id', request_record.vocabulary_id,
      'set_id', request_record.set_id
    )
  );

  return 'ok';
end;
$$;
