-- ======== NOTIFY ON REPLY ========
-- Adds a notification when a *new* reply is added to table `replies`
create or replace function notify_on_reply()
returns trigger
language plpgsql
security definer
as $$
declare
  v_recipient_id uuid;
begin
  if new.reply_id is not null then
    -- Nested reply: notify the author of the reply being replied to
    select user_id
      into v_recipient_id
    from replies
    where id = new.reply_id;
  else
    -- Top-level reply: notify the author of the post
    select user_id
      into v_recipient_id
    from posts
    where id = new.post_id;
  end if;

  -- Skip if no recipient was found or the actor is replying to themselves
  if v_recipient_id is null or v_recipient_id = new.user_id then
    return new;
  end if;

  insert into notifications (user_id, actor_id, type, post_id, reply_id)
  values (
    v_recipient_id, -- recipient (parent reply author or post author)
    new.user_id,    -- actor
    'reply',
    new.post_id,    -- post involved
    new.id          -- reply involved
  );

  return new;
end;
$$;

drop trigger if exists reply_notify on replies;
create trigger reply_notify
after insert on replies
for each row
execute function notify_on_reply();









-- ======== CREATE MENTION NOTIFICATIONS ========
-- Adds a new notification whenever a @mention is found inside a post or reply
-- ======== CREATE MENTION NOTIFICATIONS ========
-- Adds a new notification whenever a @mention is found inside a post or reply,
-- capped at a configurable limit per post/reply.
create or replace function public.create_mention_notifications()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  v_source_text text;
  v_actor_id uuid;
  v_mentioned_id uuid;
  v_max_mentions integer;
begin
  if tg_table_name = 'posts' then
    v_source_text := new.body;
    v_actor_id := new.user_id;
  elsif tg_table_name = 'replies' then
    v_source_text := new.text;
    v_actor_id := new.user_id;
  else
    return new;
  end if;

  if v_source_text is null then
    return new;
  end if;

  v_max_mentions := public.get_limit('max_mentions_per_item', 10);

  if v_max_mentions <= 0 then
    return new;
  end if;

  for v_mentioned_id in
    select distinct (m[1])::uuid
    from regexp_matches(
      v_source_text,
      '@\[user:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]',
      'g'
    ) as m
    join public.users u on u.id = (m[1])::uuid
    where (m[1])::uuid <> v_actor_id
    limit v_max_mentions
  loop
    insert into public.notifications (
      user_id,
      actor_id,
      type,
      post_id,
      reply_id
    )
    values (
      v_mentioned_id,
      v_actor_id,
      'mention',
      case when tg_table_name = 'posts' then new.id else new.post_id end,
      case when tg_table_name = 'replies' then new.id else null end
    );
  end loop;

  return new;
end;
$$;

create trigger trg_posts_mention_notifications
after insert on public.posts
for each row
execute function public.create_mention_notifications();

create trigger trg_replies_mention_notifications
after insert on public.replies
for each row
execute function public.create_mention_notifications();










-- ======== HANDLE NEW USER ========
-- Function to create a user row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
language plpgsql
security definer
as $$
begin
  insert into public.users (id, username, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    now()
  );
  return new;
end;
$$;

-- Trigger on auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();









-- ======= ENFORCE TOTAL COMMUNITY LIMIT ========
create or replace function public.enforce_total_community_limit()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  total_count integer;
  max_communities integer;
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;

  if new.owner_id is null then
    raise exception 'Authentication required to create a community';
  end if;

  max_communities := public.get_limit('max_communities_per_user', 3);

  if max_communities <= 0 then
    raise exception 'Community creation is temporarily disabled'
      using errcode = 'P0001';
  end if;

  select count(*)
    into total_count
    from public.communities
   where owner_id = new.owner_id;

  if total_count >= max_communities then
    raise exception 'Community limit reached (max % per account)', max_communities
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_total_community_limit on public.communities;

create trigger trg_enforce_total_community_limit
  before insert on public.communities
  for each row
  execute function public.enforce_total_community_limit();










-- ======== POST RATE LIMIT ========
create or replace function public.enforce_post_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  perform public.check_rate_limit(
    new.user_id,
    'posts',
    'user_id',
    interval '10 minutes',
    'max_posts_per_10m',
    5,
    'Posting too quickly. Please wait a few minutes and try again.'
  );

  return new;
end;
$$;

create or replace function public.enforce_reply_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  perform public.check_rate_limit(
    new.user_id,
    'replies',
    'user_id',
    interval '5 minutes',
    'max_replies_per_5m',
    15,
    'Replying too quickly. Please slow down and try again.'
  );

  return new;
end;
$$;

drop trigger if exists trg_enforce_post_rate_limit on public.posts;

create trigger trg_enforce_post_rate_limit
  before insert on public.posts
  for each row
  execute function public.enforce_post_rate_limit();

drop trigger if exists trg_enforce_reply_rate_limit on public.replies;

create trigger trg_enforce_reply_rate_limit
  before insert on public.replies
  for each row
  execute function public.enforce_reply_rate_limit();









