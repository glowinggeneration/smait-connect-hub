
-- === integrations ===
DROP POLICY IF EXISTS "Admins can manage all integrations" ON public.integrations;
CREATE POLICY "Admins can manage all integrations" ON public.integrations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integrations;
CREATE POLICY "Users can manage their own integrations" ON public.integrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
CREATE POLICY "Users can view their own integrations" ON public.integrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- === leads ===
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;
CREATE POLICY "Admins can manage all leads" ON public.leads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- === tools ===
DROP POLICY IF EXISTS "Admins can manage all tools" ON public.tools;
CREATE POLICY "Admins can manage all tools" ON public.tools
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- === agent_outputs ===
DROP POLICY IF EXISTS "Admins can manage all agent outputs" ON public.agent_outputs;
CREATE POLICY "Admins can manage all agent outputs" ON public.agent_outputs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- === agent_runs ===
DROP POLICY IF EXISTS "Admins can manage all agent runs" ON public.agent_runs;
CREATE POLICY "Admins can manage all agent runs" ON public.agent_runs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- === meetings ===
DROP POLICY IF EXISTS "Admins can manage all meetings" ON public.meetings;
CREATE POLICY "Admins can manage all meetings" ON public.meetings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients can view their meetings" ON public.meetings;
CREATE POLICY "Clients can view their meetings" ON public.meetings
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- === activities ===
DROP POLICY IF EXISTS "Admins can manage all activities" ON public.activities;
CREATE POLICY "Admins can manage all activities" ON public.activities
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view activities for their projects" ON public.activities;
CREATE POLICY "Users can view activities for their projects" ON public.activities
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = activities.project_id AND projects.client_id = auth.uid()
  )));

-- === project_team ===
DROP POLICY IF EXISTS "Admins can manage project teams" ON public.project_team;
CREATE POLICY "Admins can manage project teams" ON public.project_team
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Team members can view their assignments" ON public.project_team;
CREATE POLICY "Team members can view their assignments" ON public.project_team
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- === brief_documents ===
DROP POLICY IF EXISTS "Admins can manage all brief documents" ON public.brief_documents;
CREATE POLICY "Admins can manage all brief documents" ON public.brief_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients can upload to their briefs" ON public.brief_documents;
CREATE POLICY "Clients can upload to their briefs" ON public.brief_documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_briefs WHERE project_briefs.id = brief_documents.brief_id AND project_briefs.client_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Clients can view their brief documents" ON public.brief_documents;
CREATE POLICY "Clients can view their brief documents" ON public.brief_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM project_briefs WHERE project_briefs.id = brief_documents.brief_id AND project_briefs.client_id = auth.uid()
  ));

-- === project_milestones ===
DROP POLICY IF EXISTS "Admins can manage all milestones" ON public.project_milestones;
CREATE POLICY "Admins can manage all milestones" ON public.project_milestones
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients can view their project milestones" ON public.project_milestones;
CREATE POLICY "Clients can view their project milestones" ON public.project_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.client_id = auth.uid()
  ));

-- === milestone_attachments ===
DROP POLICY IF EXISTS "Admins can manage all attachments" ON public.milestone_attachments;
CREATE POLICY "Admins can manage all attachments" ON public.milestone_attachments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view attachments on their project milestones" ON public.milestone_attachments;
CREATE POLICY "Users can view attachments on their project milestones" ON public.milestone_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM project_milestones pm JOIN projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_attachments.milestone_id AND (p.client_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

-- === milestone_comments ===
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.milestone_comments;
CREATE POLICY "Admins can manage all comments" ON public.milestone_comments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can add comments" ON public.milestone_comments;
CREATE POLICY "Users can add comments" ON public.milestone_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view comments on their project milestones" ON public.milestone_comments;
CREATE POLICY "Users can view comments on their project milestones" ON public.milestone_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM project_milestones pm JOIN projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_comments.milestone_id AND (p.client_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

-- === project_briefs ===
DROP POLICY IF EXISTS "Admins can manage all briefs" ON public.project_briefs;
CREATE POLICY "Admins can manage all briefs" ON public.project_briefs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients can create their own briefs" ON public.project_briefs;
CREATE POLICY "Clients can create their own briefs" ON public.project_briefs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can view their own briefs" ON public.project_briefs;
CREATE POLICY "Clients can view their own briefs" ON public.project_briefs
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

-- === projects ===
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" ON public.projects
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
CREATE POLICY "Clients can view their own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- === tasks ===
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
CREATE POLICY "Admins can manage all tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON public.tasks;
CREATE POLICY "Users can view tasks assigned to them" ON public.tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;
CREATE POLICY "Users can view tasks in their projects" ON public.tasks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.client_id = auth.uid()
  ));

-- === messages ===
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- === notifications ===
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
