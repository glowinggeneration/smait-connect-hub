-- Create leads table for sales pipeline
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name TEXT NOT NULL,
    project_description TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'pitched', 'negotiating', 'closed_won', 'closed_lost')),
    pitch_link TEXT,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_assignees table for many-to-many relationship with admins
CREATE TABLE public.lead_assignees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(lead_id, user_id)
);

-- Add url column to tools table
ALTER TABLE public.tools ADD COLUMN url TEXT;

-- Enable RLS on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lead_assignees
ALTER TABLE public.lead_assignees ENABLE ROW LEVEL SECURITY;

-- RLS policies for leads - Admins can manage all leads
CREATE POLICY "Admins can manage all leads"
ON public.leads
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for lead_assignees - Admins can manage all assignees
CREATE POLICY "Admins can manage all lead assignees"
ON public.lead_assignees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();