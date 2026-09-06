import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AgentRunProvider } from "@/contexts/AgentRunContext";
import { IntelligenceProvider } from "@/contexts/IntelligenceContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ActiveRunBanner } from "@/components/agents/ActiveRunBanner";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

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
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      <ActiveRunBanner />
      <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        
        {/* Consolidated Admin Routes */}
        <Route path="/command" element={<ProtectedRoute><Command /></ProtectedRoute>} />
        <Route path="/work" element={<ProtectedRoute><Work /></ProtectedRoute>} />
        <Route path="/intelligence" element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
        
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
        <Route path="/admin/project/:id" element={<ProtectedRoute><AdminProjectDetail /></ProtectedRoute>} />
        <Route path="/admin/client/:clientId" element={<ProtectedRoute><AdminClientDetail /></ProtectedRoute>} />
        
        {/* Client Routes */}
        <Route path="/client" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/client/projects" element={<ProtectedRoute><ClientProjects /></ProtectedRoute>} />
        <Route path="/client/messages" element={<ProtectedRoute><ClientMessages /></ProtectedRoute>} />
        <Route path="/client/calendar" element={<ProtectedRoute><ClientCalendar /></ProtectedRoute>} />
        <Route path="/client/new-brief" element={<ProtectedRoute><ClientNewBrief /></ProtectedRoute>} />
        <Route path="/client/notifications" element={<ProtectedRoute><ClientNotifications /></ProtectedRoute>} />
        <Route path="/client/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        <Route path="/client/project/:id" element={<ProtectedRoute><ClientProjectDetail /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AgentRunProvider>
            <IntelligenceProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </TooltipProvider>
            </IntelligenceProvider>
          </AgentRunProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
