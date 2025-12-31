-- Add meeting_link column to meetings table for storing video conference links
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meeting_link text;

-- Create integrations table to store OAuth credentials and tokens
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL, -- 'google', 'zoom', 'microsoft'
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  calendar_id text, -- For Google Calendar
  enabled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own integrations
CREATE POLICY "Users can view their own integrations"
ON public.integrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations"
ON public.integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all integrations
CREATE POLICY "Admins can manage all integrations"
ON public.integrations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();