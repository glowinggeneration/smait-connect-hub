-- Create storage bucket for project planner assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-planner', 'project-planner', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload project planner files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-planner' AND auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view project planner files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-planner');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete project planner files"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-planner' AND auth.role() = 'authenticated');