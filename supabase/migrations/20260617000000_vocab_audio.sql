-- 词条音频：VoiceVox 预生成的单词 + 4 个例句音频，存于 storage，路径记于 vocabulary。
alter table public.vocabulary
  add column if not exists audio_status text not null default 'missing',
  add column if not exists audio_paths jsonb;

-- 管理员/所有者写入某词条的音频状态与路径（与 update_vocabulary_item 同权限）
create or replace function public.set_vocabulary_audio(
  p_vocabulary_id bigint,
  p_status text,
  p_paths jsonb
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

  select set_id into target_set_id
  from public.vocabulary
  where id = p_vocabulary_id;

  if not found then
    return 'not_found';
  end if;

  if not exists (
    select 1 from public.set_members
    where set_id = target_set_id
      and user_id = current_user_id
      and (
        role = 'owner'
        or (can_edit_phrases = true)
        or (can_contribute = true)
      )
  ) then
    return 'forbidden';
  end if;

  update public.vocabulary
  set audio_status = coalesce(p_status, 'missing'),
      audio_paths = p_paths
  where id = p_vocabulary_id;

  return 'ok';
end;
$$;

-- ── Storage 桶（公开读）。如已存在则忽略。 ──────────────────────────────────
insert into storage.buckets (id, name, public)
values ('vocab_audio', 'vocab_audio', true)
on conflict (id) do nothing;

-- 已登录用户可写入/更新该桶内的音频文件
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'vocab_audio_insert'
  ) then
    create policy "vocab_audio_insert" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'vocab_audio');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'vocab_audio_update'
  ) then
    create policy "vocab_audio_update" on storage.objects
      for update to authenticated
      using (bucket_id = 'vocab_audio');
  end if;
end $$;
