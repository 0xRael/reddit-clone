-- TABLE DEFINITIONS

-- Users table
create table public.users (
  id uuid not null default gen_random_uuid (),
  username text not null,
  created_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;

-- Communities table
create table public.communities (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  owner_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint communities_pkey primary key (id),
  constraint communities_name_key unique (name),
  constraint communities_owner_id_fkey foreign KEY (owner_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Posts table
create table public.posts (
  id uuid not null default gen_random_uuid (),
  title text null,
  body text null,
  user_id uuid not null,
  community_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_community_id_fkey foreign KEY (community_id) references communities (id) on delete set null,
  constraint posts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Replies table (self-referencing for nested replies)
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

-- Votes table (can belong to either a post or a reply)
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

-- Bookmarks table
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

-- Moderators table
create table public.moderators (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  community_id uuid not null,
  constraint moderators_pkey primary key (id),
  constraint moderators_user_id_community_id_key unique (user_id, community_id),
  constraint moderators_community_id_fkey foreign KEY (community_id) references communities (id) on delete CASCADE,
  constraint moderators_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Joins table (community memberships)
create table public.joins (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  community_id uuid not null,
  constraint joins_pkey primary key (id),
  constraint joins_user_id_community_id_key unique (user_id, community_id),
  constraint joins_community_id_fkey foreign KEY (community_id) references communities (id) on delete CASCADE,
  constraint joins_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Notifications
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









-- VIEWS












-- FUNCTIONS AND TRIGGERS

create or replace function notify_on_reply()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into notifications (user_id, actor_id, type, post_id, reply_id)
  values (
    (select user_id from posts where id = new.post_id), -- recipient
    new.user_id,                                        -- actor
    'reply',
    new.post_id,                                        -- post involved
    new.id                                              -- reply involved
  );
  return new;
end;
$$;

create trigger reply_notify
after INSERT on replies for EACH row
execute FUNCTION notify_on_reply ();

-- Function to create a user row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
language plpgsql
security definer
as $$
begin
  insert into public.users (id, username, email, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.email,
    now()
  );
  return new;
end;
$$;

-- Trigger on auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();