-- Allow authenticated users to delete their own avatar objects from Storage.
-- Apply after 0001-0005.
--
-- NOTE (hosted Supabase):
-- Some projects cannot CREATE POLICY on `storage.objects` from the SQL Editor
-- due to ownership restrictions. If this migration errors with a permissions
-- message, create the same policy in the Dashboard UI instead.

drop policy if exists "avatars: authenticated users delete own objects" on storage.objects;
create policy "avatars: authenticated users delete own objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
