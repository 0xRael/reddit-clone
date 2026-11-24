-- =========== PUBLIC SCHEMA ===========

-- 1. Users table
create table public.users (
  id uuid not null default gen_random_uuid (),
  username text not null,
  created_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;





-- 2. Communities table
create table public.communities (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  owner_id uuid not null,
  icon_url text null,
  banner_url text null,
  created_at timestamp with time zone null default now(),
  constraint communities_pkey primary key (id),
  constraint communities_name_key unique (name),
  constraint communities_owner_id_fkey foreign KEY (owner_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;





-- 3. Posts table
create table public.posts (
  id uuid not null default gen_random_uuid (),
  title text null,
  body text null,
  user_id uuid not null,
  community_id uuid null,
  image_url text null,
  created_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_community_id_fkey foreign KEY (community_id) references communities (id) on delete set null,
  constraint posts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;





-- 4. Replies table (self-referencing for nested replies)
create table public.replies (
  id uuid not null default gen_random_uuid (),
  text text null,
  user_id uuid not null,
  post_id uuid not null,
  reply_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint replies_pkey primary key (id),
  constraint replies_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint replies_reply_id_fkey foreign KEY (reply_id) references replies (id) on delete CASCADE,
  constraint replies_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;





-- 5. Votes table (can belong to either a post or a reply)
create table public.vote (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  post_id uuid null,
  reply_id uuid null,
  type smallint not null,
  constraint vote_pkey primary key (id),
  constraint unique_user_reply_vote unique (user_id, reply_id),
  constraint unique_user_post_vote unique (user_id, post_id),
  constraint vote_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint vote_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint vote_reply_id_fkey foreign KEY (reply_id) references replies (id) on delete CASCADE,
  constraint vote_type_check check ((type = any (array['-1'::integer, 1]))),
  constraint vote_target_check check (
    (
      (
        (post_id is not null)
        and (reply_id is null)
      )
      or (
        (post_id is null)
        and (reply_id is not null)
      )
    )
  )
) TABLESPACE pg_default;





-- 6. Bookmarks table
create table public.bookmarks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint bookmarks_pkey primary key (id),
  constraint bookmarks_user_id_post_id_key unique (user_id, post_id),
  constraint bookmarks_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint bookmarks_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;





-- 7. Moderators table
create table public.moderators (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  community_id uuid not null,
  constraint moderators_pkey primary key (id),
  constraint moderators_user_id_community_id_key unique (user_id, community_id),
  constraint moderators_community_id_fkey foreign KEY (community_id) references communities (id) on delete CASCADE,
  constraint moderators_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;





-- 8. Joins table (community memberships)
create table public.joins (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  community_id uuid not null,
  constraint joins_pkey primary key (id),
  constraint joins_user_id_community_id_key unique (user_id, community_id),
  constraint joins_community_id_fkey foreign KEY (community_id) references communities (id) on delete CASCADE,
  constraint joins_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;





-- 9. Notifications
create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  actor_id uuid null,
  type text not null,
  created_at timestamp with time zone null default now(),
  read boolean null default false,
  post_id uuid null,
  reply_id uuid null,
  constraint notifications_pkey primary key (id),
  constraint notifications_actor_id_fkey foreign KEY (actor_id) references users (id) on delete CASCADE,
  constraint notifications_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint notifications_reply_id_fkey foreign KEY (reply_id) references replies (id) on delete CASCADE,
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;











-- =========== PRIVATE SCHEMA ===========
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

-- 1. App Limits
create table if not exists private.app_limits (
  key text primary key,
  value integer not null check (value >= 0),
  description text,
  updated_at timestamptz not null default now()
);

-- Lock down direct client access completely
alter table private.app_limits enable row level security;

revoke all on table private.app_limits from anon, authenticated;

insert into private.app_limits (key, value, description)
values
  ('max_communities_per_user', 3, 'Permanent max communities per account'),
  ('max_posts_per_10m', 5, 'Rolling 10-minute post limit per user'),
  ('max_posts_per_day', 25, 'Rolling 24-hour post limit per user'),
  ('max_replies_per_5m', 15, 'Rolling 5-minute reply limit per user'),
  ('max_uploads_per_day', 20, 'Rolling 24-hour storage uploads per user'),
  ('max_mentions_per_item', 10, 'Max mention notifications created per post or reply')
on conflict (key) do nothing;

