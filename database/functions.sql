-- ======== GET LIMIT ========
-- Utility function that access configurable database settings/limits, with fallback support
create or replace function public.get_limit(p_key text, p_default integer)
returns integer
language sql
security definer
set search_path = private, public
stable
as $$
  select coalesce(
    (select value from private.app_limits where key = p_key),
    p_default
  );
$$;



-- ======== CAN UPLOAD TO BUCKET ==========
create or replace function public.can_upload_to_bucket(p_bucket_id text, p_default_max integer)
returns boolean
language sql
security definer
set search_path = storage, private, public
stable
as $$
  select count(*) < public.get_limit('max_uploads_per_day', p_default_max)
    from storage.objects
   where bucket_id = p_bucket_id
     and owner_id = (select auth.uid())::text
     and created_at >= (now() - interval '24 hours');
$$;










-- ======== UTILITY TO CHECK RATE LIMIT ========
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_table_name text,
  p_user_column text,
  p_window interval,
  p_limit_key text,
  p_default_max integer,
  p_error_message text
)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
declare
  recent_count integer;
  max_allowed integer;
begin
  if p_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'P0001';
  end if;

  max_allowed := public.get_limit(p_limit_key, p_default_max);

  if max_allowed <= 0 then
    raise exception '%' , p_error_message
      using errcode = 'P0001';
  end if;

  execute format(
    'select count(*) from public.%I where %I = $1 and created_at >= (now() - $2)',
    p_table_name,
    p_user_column
  )
  into recent_count
  using p_user_id, p_window;

  if recent_count >= max_allowed then
    raise exception '%', p_error_message
      using errcode = 'P0001';
  end if;
end;
$$;
