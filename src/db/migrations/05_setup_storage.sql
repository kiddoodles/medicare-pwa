-- Create a new storage bucket for patient photos
insert into storage.buckets (id, name, public)
values ('patient-photos', 'patient-photos', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Policy: Anyone can view patient photos (since they are public profiles)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'patient-photos' );

-- Policy: Authenticated users can upload their own photo
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'patient-photos' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own photo
create policy "Users can update own photo"
on storage.objects for update
using (
  bucket_id = 'patient-photos' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own photo
create policy "Users can delete own photo"
on storage.objects for delete
using (
  bucket_id = 'patient-photos' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
