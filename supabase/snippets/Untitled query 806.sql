-- 1. Allow anyone to VIEW/GET images
CREATE POLICY "Allow public select on mercado"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mercado');

-- 2. Allow anyone to INSERT images
CREATE POLICY "Allow public insert on mercado"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'mercado');