-- Create public bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760,  -- 10MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own images
CREATE POLICY "Users can update their own property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (images are public)
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
