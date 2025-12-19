import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Inbox,
  Clock,
  Calendar,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import smaitLogo from "@/assets/smait-logo.png";

interface SidebarProps {
  userType: "admin" | "client";
}

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Inbox, label: "My Tasks", path: "/admin/tasks" },
  { icon: MessageSquare, label: "Inbox", path: "/admin/inbox" },
  { icon: FolderKanban, label: "Projects", path: "/admin/projects" },
  { icon: Users, label: "Clients", path: "/admin/clients" },
  { icon: Clock, label: "Standups", path: "/admin/standups" },
  { icon: Calendar, label: "Meetings", path: "/admin/meetings", badge: 5 },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/client", badge: null },
  { icon: FolderKanban, label: "My Projects", path: "/client/projects", badge: null },
  { icon: MessageSquare, label: "Messages", path: "/client/messages", badge: 3 },
  { icon: FileText, label: "Documents", path: "/client/documents", badge: null },
  { icon: Settings, label: "Settings", path: "/client/settings", badge: null },
];

const favoriteProjects = [
  { name: "Redwhale Design", color: "bg-smait-teal" },
  { name: "Mobile App Mock...", color: "bg-primary" },
  { name: "UI Design Revisi...", color: "bg-amber-500" },
];

export const Sidebar = ({ userType }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = userType === "admin" ? adminNavItems : clientNavItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Desktop Sidebar - Light theme matching reference */}
      <aside className="hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 w-64">
        {/* User Profile */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
              <span className="text-lg font-semibold text-amber-800">AR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">AR Shakir</p>
              <p className="text-sm text-primary">Sr. Visual Designer</p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="flex-1 py-4 px-4 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Favorites Section */}
          {userType === "admin" && (
            <div className="mt-8">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Favorites
              </p>
              <div className="space-y-1">
                {favoriteProjects.map((project, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full text-left"
                  >
                    <div className={cn("w-3 h-3 rounded-full", project.color)} />
                    <span className="text-sm truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Button */}
        <div className="p-4">
          <Button
            size="icon"
            variant="gradient"
            className="w-12 h-12 rounded-full shadow-lg shadow-primary/30"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Logout & Footer */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
          <p className="text-xs text-muted-foreground px-3">2024 SMAIT Digital License</p>
        </div>
      </aside>
    </>
  );
};
