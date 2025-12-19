-- Create project_briefs table
CREATE TABLE public.project_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('website', 'software', 'app', 'ai-automation')),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_briefs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Clients can create their own briefs"
ON public.project_briefs
FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view their own briefs"
ON public.project_briefs
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all briefs"
ON public.project_briefs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create brief_documents table for file references
CREATE TABLE public.brief_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_id UUID NOT NULL REFERENCES public.project_briefs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brief_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for documents
CREATE POLICY "Clients can view their brief documents"
ON public.brief_documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.project_briefs
  WHERE project_briefs.id = brief_documents.brief_id
  AND project_briefs.client_id = auth.uid()
));

CREATE POLICY "Clients can upload to their briefs"
ON public.brief_documents
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.project_briefs
  WHERE project_briefs.id = brief_documents.brief_id
  AND project_briefs.client_id = auth.uid()
));

CREATE POLICY "Admins can manage all brief documents"
ON public.brief_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for brief documents
INSERT INTO storage.buckets (id, name, public) VALUES ('brief-documents', 'brief-documents', false);

-- Storage policies
CREATE POLICY "Clients can upload brief documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'brief-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients can view their brief documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brief-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all brief documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brief-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_project_briefs_updated_at
BEFORE UPDATE ON public.project_briefs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();