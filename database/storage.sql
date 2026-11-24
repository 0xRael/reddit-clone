-- Storage Buckets

-- Post Images

-- 1. Allow anyone (logged in or logged out) to view images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'post_images');

-- 2. Allow logged-in users to upload images
create policy "Authenticated users can upload within daily limit"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post_images'
    and owner_id = (select auth.uid())::text
    and public.can_upload_to_bucket('post_images', 20)
  );

-- 3. Allow users to delete their own uploaded images
CREATE POLICY "Users Delete Own Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post_images' AND auth.uid() = owner);












-- Community Assets

-- Public Read (Anyone can view community icons & banners)
CREATE POLICY "Public Read Community Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'community_assets');

-- INSERT / UPDATE / DELETE Policy for Owners & Moderators
create policy "Manage Community Assets - INSERT"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community_assets'
  and (
    (storage.foldername(name))[1]::uuid in (
      select c.id
      from public.communities c
      where c.owner_id = auth.uid()
    )
    or
    (storage.foldername(name))[1]::uuid in (
      select m.community_id
      from public.moderators m
      where m.user_id = auth.uid()
    )
  )
  and storage.filename(name) in ('icon', 'banner')
);

create policy "Manage Community Assets - UPDATE"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community_assets'
  and (
    (storage.foldername(name))[1]::uuid in (
      select c.id
      from public.communities c
      where c.owner_id = auth.uid()
    )
    or
    (storage.foldername(name))[1]::uuid in (
      select m.community_id
      from public.moderators m
      where m.user_id = auth.uid()
    )
  )
  and storage.filename(name) in ('icon', 'banner')
)
with check (
  bucket_id = 'community_assets'
  and (
    (storage.foldername(name))[1]::uuid in (
      select c.id
      from public.communities c
      where c.owner_id = auth.uid()
    )
    or
    (storage.foldername(name))[1]::uuid in (
      select m.community_id
      from public.moderators m
      where m.user_id = auth.uid()
    )
  )
  and storage.filename(name) in ('icon', 'banner')
);

create policy "Manage Community Assets - DELETE"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community_assets'
  and (
    (storage.foldername(name))[1]::uuid in (
      select c.id
      from public.communities c
      where c.owner_id = auth.uid()
    )
    or
    (storage.foldername(name))[1]::uuid in (
      select m.community_id
      from public.moderators m
      where m.user_id = auth.uid()
    )
  )
  and storage.filename(name) in ('icon', 'banner')
);
