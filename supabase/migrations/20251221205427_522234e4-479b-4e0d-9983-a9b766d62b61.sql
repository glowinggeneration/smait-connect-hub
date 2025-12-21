-- Create milestones table for projects
CREATE TABLE public.project_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    scope text[],
    outcome text,
    due_date date,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    completed_at timestamp with time zone,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create milestone comments table
CREATE TABLE public.milestone_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id uuid NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create milestone attachments table (for links and images)
CREATE TABLE public.milestone_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id uuid NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    type text NOT NULL CHECK (type IN ('link', 'image')),
    url text NOT NULL,
    title text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_milestones
CREATE POLICY "Admins can manage all milestones"
ON public.project_milestones
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their project milestones"
ON public.project_milestones
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_milestones.project_id
    AND projects.client_id = auth.uid()
));

-- RLS policies for milestone_comments
CREATE POLICY "Admins can manage all comments"
ON public.milestone_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view comments on their project milestones"
ON public.milestone_comments
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM project_milestones pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_comments.milestone_id
    AND (p.client_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Users can add comments"
ON public.milestone_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for milestone_attachments
CREATE POLICY "Admins can manage all attachments"
ON public.milestone_attachments
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view attachments on their project milestones"
ON public.milestone_attachments
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM project_milestones pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_attachments.milestone_id
    AND (p.client_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

-- Create storage bucket for milestone images
INSERT INTO storage.buckets (id, name, public) VALUES ('milestone-images', 'milestone-images', true);

-- Storage policies
CREATE POLICY "Anyone can view milestone images"
ON storage.objects FOR SELECT
USING (bucket_id = 'milestone-images');

CREATE POLICY "Admins can upload milestone images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'milestone-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete milestone images"
ON storage.objects FOR DELETE
USING (bucket_id = 'milestone-images' AND has_role(auth.uid(), 'admin'));

-- Enable realtime for milestones
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_milestones;

-- Create trigger for updated_at
CREATE TRIGGER update_milestones_updated_at
BEFORE UPDATE ON public.project_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestone_comments_updated_at
BEFORE UPDATE ON public.milestone_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();