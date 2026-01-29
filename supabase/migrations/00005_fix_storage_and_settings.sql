-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES FOR AVATARS

-- Policy: Authenticated users can upload their own avatar
-- Path: avatars/{user_id}/{filename}
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
    CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy: Users can update their own avatar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy: Users can delete their own avatar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy: Anyone can view avatars (public profile photos)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
    CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- SETTINGS POLICIES (Consolidated and Safe)

-- Ensure RLS is enabled
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplication and ensure clean state
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

-- Re-create comprehensive policies

CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
