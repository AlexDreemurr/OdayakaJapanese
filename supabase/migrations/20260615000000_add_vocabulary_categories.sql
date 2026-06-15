-- 词汇词性分类：一个词可有多种分类（绝大多数只有一种）
alter table public.vocabulary
  add column if not exists categories text[] not null default '{}';

-- 管理员/所有者更新某词条的分类（与 update_vocabulary_item 相同的权限校验）
create or replace function public.update_vocabulary_categories(
  p_vocabulary_id bigint,
  p_categories text[]
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
  set categories = coalesce(p_categories, '{}')
  where id = p_vocabulary_id;

  return 'ok';
end;
$$;
