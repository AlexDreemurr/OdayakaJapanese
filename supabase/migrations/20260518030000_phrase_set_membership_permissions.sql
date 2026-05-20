alter table public.vocabulary_sets
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

update public.vocabulary_sets
set owner_id = user_id
where owner_id is null
  and user_id is not null;

create table if not exists public.set_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id bigint not null references public.vocabulary_sets(id) on delete cascade,
  role text not null default 'member',
  can_contribute boolean not null default false,
  can_edit_phrases boolean not null default false,
  can_edit_set boolean not null default false,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, set_id),
  constraint set_members_role_check check (role in ('member', 'admin', 'owner'))
);

alter table public.set_members
  add column if not exists role text not null default 'member',
  add column if not exists can_contribute boolean not null default false,
  add column if not exists can_edit_phrases boolean not null default false,
  add column if not exists can_edit_set boolean not null default false,
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

insert into public.set_members (
  user_id,
  set_id,
  role,
  can_contribute,
  can_edit_phrases,
  can_edit_set
)
select
  coalesce(owner_id, user_id),
  id,
  'owner',
  true,
  true,
  true
from public.vocabulary_sets
where coalesce(owner_id, user_id) is not null
on conflict (user_id, set_id) do update
set
  role = 'owner',
  can_contribute = true,
  can_edit_phrases = true,
  can_edit_set = true;

alter table public.set_members enable row level security;

drop policy if exists "Members can read set memberships" on public.set_members;
create policy "Members can read set memberships"
  on public.set_members
  for select
  using (auth.uid() is not null);

drop policy if exists "Users can join public sets" on public.set_members;
create policy "Users can join public sets"
  on public.set_members
  for insert
  with check (
    auth.uid() = user_id
    and role = 'member'
    and exists (
      select 1
      from public.vocabulary_sets
      where vocabulary_sets.id = set_members.set_id
        and vocabulary_sets.privacy = 'public'
    )
  );

drop policy if exists "Owners and admins can manage set members" on public.set_members;
create policy "Owners and admins can manage set members"
  on public.set_members
  for update
  using (
    exists (
      select 1
      from public.set_members manager
      where manager.set_id = set_members.set_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.set_members manager
      where manager.set_id = set_members.set_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'admin')
    )
  );

drop policy if exists "Owners and admins can invite set members" on public.set_members;
create policy "Owners and admins can invite set members"
  on public.set_members
  for insert
  with check (false);

create or replace function public.create_vocabulary_set(
  p_name text,
  p_description text default null,
  p_status text default 'open',
  p_creator text default null,
  p_privacy text default 'public',
  p_password text default null,
  p_user_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_set_id bigint;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.vocabulary_sets (
    name,
    description,
    status,
    creator,
    privacy,
    user_id,
    owner_id
  )
  values (
    nullif(trim(p_name), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(nullif(trim(p_status), ''), 'open'),
    nullif(trim(coalesce(p_creator, '')), ''),
    coalesce(nullif(trim(p_privacy), ''), 'public'),
    current_user_id,
    current_user_id
  )
  returning id into inserted_set_id;

  insert into public.set_members (
    user_id,
    set_id,
    role,
    can_contribute,
    can_edit_phrases,
    can_edit_set
  )
  values (
    current_user_id,
    inserted_set_id,
    'owner',
    true,
    true,
    true
  )
  on conflict (user_id, set_id) do nothing;

  return inserted_set_id;
end;
$$;

create or replace function public.join_vocabulary_set(
  p_set_id bigint,
  p_password text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_privacy text;
begin
  if current_user_id is null then
    return 'not_authenticated';
  end if;

  select privacy
    into target_privacy
  from public.vocabulary_sets
  where id = p_set_id;

  if not found then
    return 'not_found';
  end if;

  if target_privacy <> 'public' then
    return 'private_requires_invite';
  end if;

  insert into public.set_members (user_id, set_id, role)
  values (current_user_id, p_set_id, 'member')
  on conflict (user_id, set_id) do nothing;

  return 'ok';
end;
$$;

create or replace function public.delete_vocabulary_set(
  p_set_id bigint,
  p_password text default null
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
    return 'not_found';
  end if;

  delete from public.vocabulary_sets
  where id = p_set_id
    and coalesce(owner_id, user_id) = current_user_id;

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;

create or replace function public.invite_set_member(
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

  if not exists (
    select 1
    from public.set_members
    where set_id = p_set_id
      and user_id = current_user_id
      and role in ('owner', 'admin')
  ) then
    return 'forbidden';
  end if;

  insert into public.set_members (
    user_id,
    set_id,
    role,
    invited_by
  )
  values (
    p_user_id,
    p_set_id,
    'member',
    current_user_id
  )
  on conflict (user_id, set_id) do nothing;

  return 'ok';
end;
$$;

create or replace function public.update_set_member_permissions(
  p_set_id bigint,
  p_user_id uuid,
  p_role text,
  p_can_contribute boolean,
  p_can_edit_phrases boolean,
  p_can_edit_set boolean
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

  if not exists (
    select 1
    from public.set_members
    where set_id = p_set_id
      and user_id = current_user_id
      and role = 'owner'
  ) then
    return 'forbidden';
  end if;

  if p_role not in ('member', 'admin') then
    return 'invalid_role';
  end if;

  update public.set_members
  set
    role = p_role,
    can_contribute = p_can_contribute,
    can_edit_phrases = p_can_edit_phrases,
    can_edit_set = p_can_edit_set
  where set_id = p_set_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;
