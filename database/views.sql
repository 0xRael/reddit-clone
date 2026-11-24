-- 1. Replies amount per post
create view public.post_replies_view
with
  (security_invoker = on) as
select
  post_id,
  count(*) as count
from
  replies
group by
  post_id;




-- 2. Votes amount per post
create view public.post_votes_view
with
  (security_invoker = on) as
select
  post_id,
  count(*) filter (
    where
      type = 1
  ) as upvotes,
  count(*) filter (
    where
      type = '-1'::integer
  ) as downvotes
from
  vote
group by
  post_id;




-- 3. Votes amount per reply
create view public.reply_votes_view
with
  (security_invoker = on) as
select
  reply_id,
  count(*) filter (
    where
      type = 1
  ) as upvotes,
  count(*) filter (
    where
      type = '-1'::integer
  ) as downvotes
from
  vote
group by
  reply_id;




create index if not exists idx_communities_owner_id
  on public.communities (owner_id);

create index if not exists idx_posts_author_created_at
  on public.posts (user_id, created_at desc);

create index if not exists idx_replies_author_created_at
  on public.replies (user_id, created_at desc);
