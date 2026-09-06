CREATE TABLE public.project_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  collection text not null,
  project_id uuid references public.projects(id) on delete set null,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_files TO authenticated;
GRANT ALL ON public.project_files TO service_role;

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view project files" ON public.project_files
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR uploaded_by = auth.uid());

CREATE POLICY "Admins can upload project files" ON public.project_files
FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') AND uploaded_by = auth.uid());

CREATE POLICY "Admins can update project files" ON public.project_files
FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete project files" ON public.project_files
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_project_files_collection ON public.project_files(collection);
CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);

CREATE POLICY "Admins can read project file objects" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'project-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload project file objects" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete project file objects" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'project-files' AND has_role(auth.uid(), 'admin'));