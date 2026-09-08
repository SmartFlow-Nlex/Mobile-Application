-- SmartFlow NLEX - community feed schema
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. It is safe to run again; every statement is idempotent.
--
-- Creating tables needs elevated privileges, which the app's publishable key
-- deliberately does not have - that is why this is a manual step.

-- ---------------------------------------------------------------------------
-- Posts: both community updates and incident reports live here, split by `kind`
-- ---------------------------------------------------------------------------
create table if not exists public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  author_id   uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  kind        text not null check (kind in ('update', 'incident')),
  location    text not null,
  direction   text check (direction in ('northbound', 'southbound')),
  message     text not null default '',
  status      text not null check (status in ('smooth', 'moderate', 'heavy', 'incident')),
  -- [{ "uri": "https://.../object.jpg", "type": "image" | "video" }]
  media       jsonb not null default '[]'::jsonb
);

-- The feed is always "newest first, filtered by kind".
create index if not exists community_posts_kind_created_idx
  on public.community_posts (kind, created_at desc);

alter table public.community_posts enable row level security;

drop policy if exists "Signed-in users can read posts"    on public.community_posts;
drop policy if exists "Users can create their own posts"  on public.community_posts;
drop policy if exists "Users can delete their own posts"  on public.community_posts;

-- Everyone signed in sees the whole feed: that is the point of a community tab.
create policy "Signed-in users can read posts"
  on public.community_posts for select to authenticated using (true);

-- You may only post as yourself. Without this check a client could forge
-- author_id and post as someone else.
create policy "Users can create their own posts"
  on public.community_posts for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.community_posts for delete to authenticated
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- Likes: one row per (post, user), so a like is idempotent and per-person
-- ---------------------------------------------------------------------------
create table if not exists public.community_post_likes (
  post_id    uuid not null references public.community_posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_post_likes enable row level security;

drop policy if exists "Signed-in users can read likes" on public.community_post_likes;
drop policy if exists "Users can like as themselves"   on public.community_post_likes;
drop policy if exists "Users can remove their like"    on public.community_post_likes;

-- Readable by all so the app can show a count and whether you liked it.
create policy "Signed-in users can read likes"
  on public.community_post_likes for select to authenticated using (true);

create policy "Users can like as themselves"
  on public.community_post_likes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their like"
  on public.community_post_likes for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: photos and clips attached to posts
-- ---------------------------------------------------------------------------
-- Public bucket so any viewer can load the image without a signed URL. Nothing
-- private belongs in here.
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view community media"        on storage.objects;
drop policy if exists "Signed-in users can upload media"       on storage.objects;
drop policy if exists "Users can delete their own media"       on storage.objects;

create policy "Anyone can view community media"
  on storage.objects for select
  using (bucket_id = 'community-media');

create policy "Signed-in users can upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media');

create policy "Users can delete their own media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and owner = auth.uid());
