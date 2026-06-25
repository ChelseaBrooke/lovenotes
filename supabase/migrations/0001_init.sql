-- lovenotes — initial schema (PRD §6)
-- Applied to the Supabase project on creation. Kept here for version control.

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

create table public.spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  invite_code text unique,
  created_at  timestamptz default now()
);

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  space_id     uuid references public.spaces(id) on delete set null,
  display_name text,
  accent_color text default '#C2502E',
  created_at   timestamptz default now()
);

create type public.card_type as enum ('poem','quote','screenshot','image','video','link');

create table public.cards (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null references public.spaces(id) on delete cascade,
  author_id           uuid not null references public.profiles(id),
  type                public.card_type not null,
  note                text,
  title               text,
  body                text,
  media_path          text,
  media_width         int,
  media_height        int,
  url                 text,
  link_title          text,
  link_author         text,
  link_thumbnail_url  text,
  link_provider       text,
  created_at          timestamptz default now()
);
create index cards_space_created_idx on public.cards (space_id, created_at desc);

create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  unique (card_id, user_id)
);

create table public.replies (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  body       text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Functions & triggers
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.gen_invite_code() returns text
language sql volatile set search_path = '' as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random()*32)::int + 1, 1), '')
  from generate_series(1, 6)
$$;

alter table public.spaces alter column invite_code set default public.gen_invite_code();

create or replace function public.current_space_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select space_id from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'partner'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_space(space_name text default null) returns public.spaces
language plpgsql security definer set search_path = '' as $$
declare s public.spaces;
begin
  if (select space_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'You are already in a space';
  end if;
  insert into public.spaces (name) values (space_name) returning * into s;
  update public.profiles set space_id = s.id where id = auth.uid();
  return s;
end;
$$;

create or replace function public.join_space(code text) returns public.spaces
language plpgsql security definer set search_path = '' as $$
declare
  s public.spaces;
  member_count int;
begin
  select * into s from public.spaces where invite_code = upper(trim(code));
  if s.id is null then
    raise exception 'Invalid invite code';
  end if;
  select count(*) into member_count from public.profiles where space_id = s.id;
  if member_count >= 2 then
    raise exception 'This space is already full';
  end if;
  update public.profiles set space_id = s.id where id = auth.uid();
  return s;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Row-level security (everything keys off "is this row in my space?")
-- ─────────────────────────────────────────────────────────────────────────

alter table public.spaces    enable row level security;
alter table public.profiles  enable row level security;
alter table public.cards     enable row level security;
alter table public.reactions enable row level security;
alter table public.replies   enable row level security;

create policy spaces_select on public.spaces for select
  using (id = public.current_space_id());

create policy profiles_select on public.profiles for select
  using (id = auth.uid() or space_id = public.current_space_id());
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy cards_select on public.cards for select
  using (space_id = public.current_space_id());
create policy cards_insert on public.cards for insert
  with check (space_id = public.current_space_id() and author_id = auth.uid());
create policy cards_update on public.cards for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy cards_delete on public.cards for delete
  using (author_id = auth.uid());

create policy reactions_select on public.reactions for select
  using (exists (select 1 from public.cards c where c.id = card_id and c.space_id = public.current_space_id()));
create policy reactions_insert on public.reactions for insert
  with check (user_id = auth.uid() and exists (select 1 from public.cards c where c.id = card_id and c.space_id = public.current_space_id()));
create policy reactions_delete on public.reactions for delete
  using (user_id = auth.uid());

create policy replies_select on public.replies for select
  using (exists (select 1 from public.cards c where c.id = card_id and c.space_id = public.current_space_id()));
create policy replies_insert on public.replies for insert
  with check (author_id = auth.uid() and exists (select 1 from public.cards c where c.id = card_id and c.space_id = public.current_space_id()));
create policy replies_delete on public.replies for delete
  using (author_id = auth.uid());

-- Lock down SECURITY DEFINER functions: trigger-only is uncallable; RPCs are
-- for signed-in users only.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_space(text) from public, anon;
revoke all on function public.join_space(text) from public, anon;
revoke all on function public.current_space_id() from public, anon;
grant execute on function public.create_space(text) to authenticated;
grant execute on function public.join_space(text) to authenticated;
grant execute on function public.current_space_id() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Storage: private 'media' bucket, path {space_id}/{card_id}.{ext}
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', false, 104857600,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','video/mp4','video/quicktime']
)
on conflict (id) do nothing;

create policy media_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.current_space_id()::text);
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = public.current_space_id()::text);
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.current_space_id()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = public.current_space_id()::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.current_space_id()::text);

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime (PRD §6). Full replica identity so DELETE/UPDATE carry space_id.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.cards     replica identity full;
alter table public.reactions replica identity full;
alter table public.replies   replica identity full;

alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.replies;
