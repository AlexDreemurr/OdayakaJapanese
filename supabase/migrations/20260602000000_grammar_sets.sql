-- ============================================================
-- 语法集功能：grammar_sets / grammar_items / grammar_set_members / grammar_practice
-- 结构完全对应 vocabulary_sets / vocabulary / set_members / vocab_practice
-- ============================================================

-- ── 1. grammar_sets ────────────────────────────────────────────────────────────
create table if not exists public.grammar_sets (
  id         bigserial    primary key,
  name       text         not null,
  description text,
  creator    text,
  privacy    text         not null default 'public'
               check (privacy in ('public', 'private')),
  status     text         not null default 'open'
               check (status  in ('open',   'close')),
  user_id    uuid         references auth.users(id) on delete set null,
  owner_id   uuid         references auth.users(id) on delete set null,
  created_at timestamptz  not null default now()
);

alter table public.grammar_sets enable row level security;

-- 注意：SELECT policy 引用了 grammar_set_members，需等该表建好后再创建。
-- 见下方 "── 3. grammar_set_members ──" 之后。

drop policy if exists "Authenticated users can create grammar sets" on public.grammar_sets;
create policy "Authenticated users can create grammar sets"
  on public.grammar_sets for insert
  with check (auth.uid() is not null);

drop policy if exists "Owners can update grammar sets" on public.grammar_sets;
create policy "Owners can update grammar sets"
  on public.grammar_sets for update
  using (coalesce(owner_id, user_id) = auth.uid());

drop policy if exists "Owners can delete grammar sets" on public.grammar_sets;
create policy "Owners can delete grammar sets"
  on public.grammar_sets for delete
  using (coalesce(owner_id, user_id) = auth.uid());

-- ── 2. grammar_items ───────────────────────────────────────────────────────────
create table if not exists public.grammar_items (
  id               bigserial   primary key,
  set_id           bigint      not null references public.grammar_sets(id) on delete cascade,
  form             text        not null,
  meaning          text,
  level            text        check (level in ('N1','N2','N3','N4','N5')),
  sentences        jsonb       not null default '[]',
  contributor_name text,
  created_at       timestamptz not null default now()
);

alter table public.grammar_items enable row level security;
-- grammar_items 的 policies 引用 grammar_set_members，延后到该表建好后创建。

-- ── 3. grammar_set_members ─────────────────────────────────────────────────────
create table if not exists public.grammar_set_members (
  user_id         uuid        not null references auth.users(id) on delete cascade,
  set_id          bigint      not null references public.grammar_sets(id) on delete cascade,
  role            text        not null default 'member'
                    check (role in ('member', 'admin', 'owner')),
  can_contribute  boolean     not null default false,
  can_edit_items  boolean     not null default false,
  can_edit_set    boolean     not null default false,
  invited_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  primary key (user_id, set_id)
);

alter table public.grammar_set_members enable row level security;

-- grammar_set_members 已建好，现在可以安全创建所有引用它的 policies

-- grammar_sets SELECT policy
drop policy if exists "Grammar sets readable by members or public" on public.grammar_sets;
create policy "Grammar sets readable by members or public"
  on public.grammar_sets for select
  using (
    privacy = 'public'
    or exists (
      select 1 from public.grammar_set_members gsm
      where gsm.set_id = grammar_sets.id
        and gsm.user_id = auth.uid()
    )
  );

-- grammar_items policies
drop policy if exists "Grammar items readable by set members" on public.grammar_items;
create policy "Grammar items readable by set members"
  on public.grammar_items for select
  using (
    exists (
      select 1 from public.grammar_sets gs
      where gs.id = grammar_items.set_id
        and (
          gs.privacy = 'public'
          or exists (
            select 1 from public.grammar_set_members gsm
            where gsm.set_id = gs.id and gsm.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "Admins can insert grammar items" on public.grammar_items;
create policy "Admins can insert grammar items"
  on public.grammar_items for insert
  with check (
    exists (
      select 1 from public.grammar_set_members gsm
      where gsm.set_id = grammar_items.set_id
        and gsm.user_id = auth.uid()
        and gsm.role in ('owner', 'admin')
    )
  );

drop policy if exists "Admins can update grammar items" on public.grammar_items;
create policy "Admins can update grammar items"
  on public.grammar_items for update
  using (
    exists (
      select 1 from public.grammar_set_members gsm
      where gsm.set_id = grammar_items.set_id
        and gsm.user_id = auth.uid()
        and gsm.role in ('owner', 'admin')
        and gsm.can_edit_items = true
    )
  );

drop policy if exists "Admins can delete grammar items" on public.grammar_items;
create policy "Admins can delete grammar items"
  on public.grammar_items for delete
  using (
    exists (
      select 1 from public.grammar_set_members gsm
      where gsm.set_id = grammar_items.set_id
        and gsm.user_id = auth.uid()
        and gsm.role in ('owner', 'admin')
        and gsm.can_edit_items = true
    )
  );

drop policy if exists "Grammar set members readable by authenticated users" on public.grammar_set_members;
create policy "Grammar set members readable by authenticated users"
  on public.grammar_set_members for select
  using (auth.uid() is not null);

drop policy if exists "Users can join public grammar sets" on public.grammar_set_members;
create policy "Users can join public grammar sets"
  on public.grammar_set_members for insert
  with check (
    auth.uid() = user_id
    and role = 'member'
    and exists (
      select 1 from public.grammar_sets gs
      where gs.id = grammar_set_members.set_id
        and gs.privacy = 'public'
    )
  );

drop policy if exists "Owners and admins can manage grammar set members" on public.grammar_set_members;
create policy "Owners and admins can manage grammar set members"
  on public.grammar_set_members for update
  using (
    exists (
      select 1 from public.grammar_set_members manager
      where manager.set_id = grammar_set_members.set_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'admin')
    )
  );

drop policy if exists "Members can delete their own grammar membership" on public.grammar_set_members;
create policy "Members can delete their own grammar membership"
  on public.grammar_set_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.grammar_set_members manager
      where manager.set_id = grammar_set_members.set_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'admin')
    )
  );

-- ── 4. grammar_practice ────────────────────────────────────────────────────────
create table if not exists public.grammar_practice (
  user_id        uuid    not null references auth.users(id)       on delete cascade,
  grammar_id     bigint  not null references public.grammar_items(id) on delete cascade,
  correct_counts integer[] not null default '{}',
  attempt_counts integer[] not null default '{}',
  primary key (user_id, grammar_id)
);

alter table public.grammar_practice enable row level security;

drop policy if exists "Users can manage own grammar practice" on public.grammar_practice;
create policy "Users can manage own grammar practice"
  on public.grammar_practice for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- RPC 函数（对应 vocabulary_sets 的同名函数）
-- ══════════════════════════════════════════════════════════════════════════════

-- create_grammar_set
create or replace function public.create_grammar_set(
  p_name        text,
  p_description text    default null,
  p_status      text    default 'open',
  p_creator     text    default null,
  p_privacy     text    default 'public',
  p_password    text    default null,
  p_user_id     uuid    default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_inserted_id  bigint;
begin
  if v_user_id is null then
    return 'not_authenticated';
  end if;

  insert into public.grammar_sets (name, description, status, creator, privacy, user_id, owner_id)
  values (
    nullif(trim(p_name), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(nullif(trim(p_status), ''), 'open'),
    nullif(trim(coalesce(p_creator, '')), ''),
    coalesce(nullif(trim(p_privacy), ''), 'public'),
    v_user_id,
    v_user_id
  )
  returning id into v_inserted_id;

  insert into public.grammar_set_members (user_id, set_id, role, can_contribute, can_edit_items, can_edit_set)
  values (v_user_id, v_inserted_id, 'owner', true, true, true)
  on conflict (user_id, set_id) do nothing;

  return 'ok';
end;
$$;

-- join_grammar_set
create or replace function public.join_grammar_set(
  p_set_id  bigint,
  p_password text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_target_privacy text;
begin
  if v_user_id is null then
    return 'not_authenticated';
  end if;

  select privacy into v_target_privacy
  from public.grammar_sets
  where id = p_set_id;

  if not found then
    return 'not_found';
  end if;

  if v_target_privacy <> 'public' then
    return 'private_requires_invite';
  end if;

  insert into public.grammar_set_members (user_id, set_id, role)
  values (v_user_id, p_set_id, 'member')
  on conflict (user_id, set_id) do nothing;

  return 'ok';
end;
$$;

-- delete_grammar_set
create or replace function public.delete_grammar_set(
  p_set_id  bigint,
  p_password text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return 'not_found';
  end if;

  delete from public.grammar_sets
  where id = p_set_id
    and coalesce(owner_id, user_id) = v_user_id;

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;

-- invite_grammar_set_member
create or replace function public.invite_grammar_set_member(
  p_set_id  bigint,
  p_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  if v_caller_id is null then
    return 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.grammar_set_members
    where set_id = p_set_id
      and user_id = v_caller_id
      and role in ('owner', 'admin')
  ) then
    return 'forbidden';
  end if;

  insert into public.grammar_set_members (user_id, set_id, role, invited_by)
  values (p_user_id, p_set_id, 'member', v_caller_id)
  on conflict (user_id, set_id) do nothing;

  return 'ok';
end;
$$;

-- remove_grammar_set_member
create or replace function public.remove_grammar_set_member(
  p_set_id  bigint,
  p_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  if v_caller_id is null then
    return 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.grammar_set_members
    where set_id = p_set_id
      and user_id = v_caller_id
      and role in ('owner', 'admin')
  ) then
    return 'forbidden';
  end if;

  delete from public.grammar_set_members
  where set_id = p_set_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;

-- leave_grammar_set_member
create or replace function public.leave_grammar_set_member(
  p_set_id bigint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return 'not_authenticated';
  end if;

  delete from public.grammar_set_members
  where set_id = p_set_id
    and user_id = v_user_id
    and role <> 'owner';

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;

-- update_grammar_set_member_permissions
create or replace function public.update_grammar_set_member_permissions(
  p_set_id          bigint,
  p_user_id         uuid,
  p_role            text,
  p_can_contribute  boolean,
  p_can_edit_items  boolean,
  p_can_edit_set    boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  if v_caller_id is null then
    return 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.grammar_set_members
    where set_id = p_set_id
      and user_id = v_caller_id
      and role = 'owner'
  ) then
    return 'forbidden';
  end if;

  if p_role not in ('member', 'admin') then
    return 'invalid_role';
  end if;

  update public.grammar_set_members
  set
    role           = p_role,
    can_contribute = p_can_contribute,
    can_edit_items = p_can_edit_items,
    can_edit_set   = p_can_edit_set
  where set_id = p_set_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;
