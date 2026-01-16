-- Create agent_runs table to store agent run history
CREATE TABLE public.agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  progress INTEGER NOT NULL DEFAULT 0,
  current_agent TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_agents INTEGER NOT NULL DEFAULT 18,
  completed_agents INTEGER NOT NULL DEFAULT 0
);

-- Create agent_outputs table to store individual agent outputs
CREATE TABLE public.agent_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  phase INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_runs
CREATE POLICY "Admins can manage all agent runs"
  ON public.agent_runs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for agent_outputs
CREATE POLICY "Admins can manage all agent outputs"
  ON public.agent_outputs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for agent runs and outputs
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_outputs;

-- Create index for faster queries
CREATE INDEX idx_agent_runs_created_by ON public.agent_runs(created_by);
CREATE INDEX idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX idx_agent_outputs_run_id ON public.agent_outputs(run_id);