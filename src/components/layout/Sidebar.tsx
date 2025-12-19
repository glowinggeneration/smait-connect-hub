import { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  userType: "admin" | "client";
}

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url: string | null;
  company: string | null;
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


export const Sidebar = ({ userType }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = userType === "admin" ? adminNavItems : clientNavItems;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, company")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = () => {
    if (userRole === "admin") return "Administrator";
    if (userRole === "client") return userProfile?.company || "Client";
    return "User";
  };

  return (
    <>
      {/* Desktop Sidebar - Light theme matching reference */}
      <aside className="hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 w-64">
        {/* User Profile */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800">
                {getInitials(userProfile?.full_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {userProfile?.full_name || "Loading..."}
              </p>
              <p className="text-sm text-primary truncate">{getRoleLabel()}</p>
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
