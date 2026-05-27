create or replace function public.request_vocabulary_item_change(
  p_vocabulary_id bigint,
  p_action text,
  p_changes jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_set_id bigint;
  target_set_name text;
  target_word text;
  target_reading text;
  target_pitch integer;
  target_meaning text;
  target_contributor_name text;
  requester_name text;
  requester_avatar_path text;
  original_snapshot jsonb;
  request_id bigint;
  message_content text;
begin
  if current_user_id is null then
    return 'not_authenticated';
  end if;

  if p_action not in ('update', 'delete') then
    return 'invalid_action';
  end if;

  select
    vocabulary.set_id,
    vocabulary_sets.name,
    vocabulary.word,
    vocabulary.reading,
    vocabulary.pitch,
    vocabulary.meaning,
    vocabulary.contributor_name
    into
      target_set_id,
      target_set_name,
      target_word,
      target_reading,
      target_pitch,
      target_meaning,
      target_contributor_name
  from public.vocabulary
  join public.vocabulary_sets on vocabulary_sets.id = vocabulary.set_id
  where vocabulary.id = p_vocabulary_id;

  if not found then
    return 'not_found';
  end if;

  if exists (
    select 1
    from public.set_members
    where set_id = target_set_id
      and user_id = current_user_id
      and (
        role = 'owner'
        or (role = 'admin' and can_edit_phrases = true)
      )
  ) then
    return 'already_allowed';
  end if;

  if not exists (
    select 1
    from public.set_members
    where set_id = target_set_id
      and user_id = current_user_id
  ) then
    return 'forbidden';
  end if;

  select
    coalesce(nullif(display_name, ''), nullif(email, ''), '用户'),
    avatar_path
    into requester_name, requester_avatar_path
  from public.user_profiles
  where user_id = current_user_id;

  requester_name := coalesce(requester_name, '用户');
  original_snapshot := jsonb_build_object(
    'set_name', target_set_name,
    'word', target_word,
    'reading', target_reading,
    'pitch', target_pitch,
    'meaning', target_meaning,
    'contributor_name', target_contributor_name
  );

  insert into public.vocabulary_change_requests (
    vocabulary_id,
    set_id,
    requester_id,
    action,
    original_data,
    changes
  )
  values (
    p_vocabulary_id,
    target_set_id,
    current_user_id,
    p_action,
    original_snapshot,
    coalesce(p_changes, '{}'::jsonb)
  )
  returning id into request_id;

  message_content :=
    requester_name
    || case when p_action = 'delete' then ' 请求删除词汇集「' else ' 请求修改词汇集「' end
    || coalesce(target_set_name, '未命名词汇集')
    || '」中的词条「'
    || coalesce(target_word, '未命名词条')
    || '」。';

  insert into public.app_messages (
    recipient_id,
    sender_id,
    sender_name,
    sender_avatar_path,
    type,
    content,
    metadata
  )
  select
    member.user_id,
    current_user_id,
    requester_name,
    requester_avatar_path,
    'info',
    message_content,
    jsonb_build_object(
      'kind', 'vocabulary_change_request',
      'request', jsonb_build_object(
        'id', request_id,
        'action', p_action,
        'status', 'pending'
      ),
      'vocabulary', jsonb_build_object(
        'id', p_vocabulary_id,
        'set_id', target_set_id,
        'set_name', target_set_name
      ),
      'original', original_snapshot,
      'changes', coalesce(p_changes, '{}'::jsonb),

      -- Legacy keys kept so old frontend builds still understand this message.
      'request_id', request_id,
      'vocabulary_id', p_vocabulary_id,
      'set_id', target_set_id,
      'set_name', target_set_name,
      'action', p_action,
      'status', 'pending'
    )
  from public.set_members member
  where member.set_id = target_set_id
    and member.user_id <> current_user_id
    and (
      member.role = 'owner'
      or (member.role = 'admin' and member.can_edit_phrases = true)
    );

  return 'ok';
end;
$$;
