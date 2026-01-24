import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AgentRunProvider } from "@/contexts/AgentRunContext";
import { IntelligenceProvider } from "@/contexts/IntelligenceContext";
import { ActiveRunBanner } from "@/components/agents/ActiveRunBanner";
import Login from "./pages/Login";

// New consolidated pages
import Command from "./pages/admin/Command";
import Work from "./pages/admin/Work";
import Intelligence from "./pages/admin/Intelligence";
import Network from "./pages/admin/Network";
import Assets from "./pages/admin/Assets";
import Operations from "./pages/admin/Operations";

// Legacy pages for project detail and client views
import AdminProjectDetail from "./pages/admin/AdminProjectDetail";
import AdminClientDetail from "./pages/admin/AdminClientDetail";

// Client pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProjects from "./pages/client/ClientProjects";
import ClientMessages from "./pages/client/ClientMessages";
import ClientCalendar from "./pages/client/ClientCalendar";
import ClientNewBrief from "./pages/client/ClientNewBrief";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientProjectDetail from "./pages/client/ClientProjectDetail";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AgentRunProvider>
        <IntelligenceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ActiveRunBanner />
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                
                {/* Consolidated Admin Routes */}
                <Route path="/command" element={<Command />} />
                <Route path="/work" element={<Work />} />
                <Route path="/intelligence" element={<Intelligence />} />
                <Route path="/network" element={<Network />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/operations" element={<Operations />} />
                
                {/* Legacy redirects */}
                <Route path="/admin" element={<Navigate to="/command" replace />} />
                <Route path="/admin/projects" element={<Navigate to="/work?tab=initiatives" replace />} />
                <Route path="/admin/tasks" element={<Navigate to="/work?tab=assignments" replace />} />
                <Route path="/admin/briefs" element={<Navigate to="/work?tab=briefs" replace />} />
                <Route path="/admin/standups" element={<Navigate to="/work?tab=standups" replace />} />
                <Route path="/admin/meetings" element={<Navigate to="/work?tab=calendar" replace />} />
                <Route path="/admin/leads" element={<Navigate to="/network?tab=prospects" replace />} />
                <Route path="/admin/clients" element={<Navigate to="/network?tab=relationships" replace />} />
                <Route path="/admin/inbox" element={<Navigate to="/network?tab=communication" replace />} />
                <Route path="/admin/agents" element={<Navigate to="/intelligence?tab=operators" replace />} />
                <Route path="/admin/ai-pm" element={<Navigate to="/intelligence?tab=signals" replace />} />
                <Route path="/admin/project-planner" element={<Navigate to="/intelligence?tab=planner" replace />} />
                <Route path="/admin/users" element={<Navigate to="/operations?tab=team" replace />} />
                <Route path="/admin/tools" element={<Navigate to="/operations?tab=tools" replace />} />
                <Route path="/admin/integrations" element={<Navigate to="/operations?tab=integrations" replace />} />
                <Route path="/admin/settings" element={<Navigate to="/operations?tab=settings" replace />} />
                
                {/* Detail pages */}
                <Route path="/admin/project/:id" element={<AdminProjectDetail />} />
                <Route path="/admin/client/:clientId" element={<AdminClientDetail />} />
                
                {/* Client Routes */}
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/client/projects" element={<ClientProjects />} />
                <Route path="/client/messages" element={<ClientMessages />} />
                <Route path="/client/calendar" element={<ClientCalendar />} />
                <Route path="/client/new-brief" element={<ClientNewBrief />} />
                <Route path="/client/notifications" element={<ClientNotifications />} />
                <Route path="/client/settings" element={<AdminSettings />} />
                <Route path="/client/project/:id" element={<ClientProjectDetail />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </IntelligenceProvider>
      </AgentRunProvider>
    </QueryClientProvider>
  );
};

export default App;
