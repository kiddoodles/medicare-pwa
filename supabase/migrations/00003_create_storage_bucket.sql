-- Create storage bucket for medication images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-90t1jgnsbt35_medication_images',
  'app-90t1jgnsbt35_medication_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
);

-- Create storage policies
CREATE POLICY "Authenticated users can upload medication images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'app-90t1jgnsbt35_medication_images');

CREATE POLICY "Anyone can view medication images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'app-90t1jgnsbt35_medication_images');

CREATE POLICY "Users can update their own medication images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'app-90t1jgnsbt35_medication_images');

CREATE POLICY "Users can delete their own medication images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'app-90t1jgnsbt35_medication_images');