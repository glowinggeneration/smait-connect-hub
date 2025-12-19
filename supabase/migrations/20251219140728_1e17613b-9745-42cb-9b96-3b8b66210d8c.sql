-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Enable realtime for activities table
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;