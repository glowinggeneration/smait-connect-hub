import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProjectDetail from "./pages/admin/AdminProjectDetail";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminStandups from "./pages/admin/AdminStandups";
import AdminMeetings from "./pages/admin/AdminMeetings";
import AdminBriefs from "./pages/admin/AdminBriefs";
import AdminTools from "./pages/admin/AdminTools";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProjects from "./pages/client/ClientProjects";
import ClientMessages from "./pages/client/ClientMessages";
import ClientCalendar from "./pages/client/ClientCalendar";
import ClientNewBrief from "./pages/client/ClientNewBrief";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientProjectDetail from "./pages/client/ClientProjectDetail";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/admin/inbox" element={<AdminInbox />} />
            <Route path="/admin/standups" element={<AdminStandups />} />
            <Route path="/admin/meetings" element={<AdminMeetings />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/briefs" element={<AdminBriefs />} />
            <Route path="/admin/tools" element={<AdminTools />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
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
    </QueryClientProvider>
  );
};

export default App;
