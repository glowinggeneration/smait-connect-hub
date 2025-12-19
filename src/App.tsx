import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminClients from "./pages/admin/AdminClients";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProjectDetail from "./pages/admin/AdminProjectDetail";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProjects from "./pages/client/ClientProjects";
import ClientMessages from "./pages/client/ClientMessages";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientProjectDetail from "./pages/client/ClientProjectDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tasks" element={<AdminDashboard />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/standups" element={<AdminDashboard />} />
          <Route path="/admin/meetings" element={<AdminDashboard />} />
          <Route path="/admin/project/:id" element={<AdminProjectDetail />} />
          {/* Client Routes */}
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/projects" element={<ClientProjects />} />
          <Route path="/client/messages" element={<ClientMessages />} />
          <Route path="/client/documents" element={<ClientDocuments />} />
          <Route path="/client/settings" element={<AdminSettings />} />
          <Route path="/client/project/:id" element={<ClientProjectDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
